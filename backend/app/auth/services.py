import logging
import uuid
from datetime import datetime, timezone
from typing import Optional, Tuple, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from backend.app.auth.schemas import UserRegisterSchema, UserLoginSchema
from backend.app.db.models import UserModel, RoleModel, PermissionModel
from backend.app.auth.models import UserRefreshTokenModel
from backend.app.auth.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token
)
from backend.app.exceptions.custom_exceptions import (
    AuthenticationFailedException,
    EntityNotFoundException,
    ActionForbiddenException
)

logger = logging.getLogger("factory_gpt.auth.services")

class AuthenticationService:

    async def get_or_create_internal_role(self, session: AsyncSession, name: str) -> RoleModel:
        statement = select(RoleModel).where(RoleModel.name == name)
        result = await session.execute(statement)
        role = result.scalar_one_or_none()
        
        if not role:
            role = RoleModel(
                id=str(uuid.uuid4()),
                name=name,
                description=f"System generated {name} role"
            )
            session.add(role)
            await session.flush()
        return role

    async def register_user(self, session: AsyncSession, payload: UserRegisterSchema) -> UserModel:
        check_stmt = select(UserModel).where(UserModel.email == payload.email)
        check_res = await session.execute(check_stmt)
        if check_res.scalar_one_or_none() is not None:
            raise ActionForbiddenException(f"Account with email address {payload.email} already exists.")

        target_role = await self.get_or_create_internal_role(session, payload.role_name)
        
        hashed_pwd = hash_password(payload.password)
        new_user = UserModel(
            id=str(uuid.uuid4()),
            email=payload.email,
            hashed_password=hashed_pwd,
            full_name=payload.full_name,
            role_id=target_role.id,
            is_active=True
        )
        
        session.add(new_user)
        await session.commit()
        await session.refresh(new_user)
        
        # Reload with role relationship loaded
        stmt = select(UserModel).where(UserModel.id == new_user.id).options(
            selectinload(UserModel.role).selectinload(RoleModel.permissions)
        )
        res = await session.execute(stmt)
        return res.scalar_one()

    async def authenticate_user(self, session: AsyncSession, payload: UserLoginSchema) -> UserModel:
        stmt = select(UserModel).where(
            UserModel.email == payload.email,
            UserModel.deleted_at.is_(None)
        ).options(
            selectinload(UserModel.role).selectinload(RoleModel.permissions)
        )
        
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()
        
        if not user or not verify_password(payload.password, user.hashed_password):
            raise AuthenticationFailedException("Incorrect email or password configured.")
            
        if not user.is_active:
            raise ActionForbiddenException("Your user profile is currently deactivated.")
            
        return user

    async def store_refresh_token(
        self, 
        session: AsyncSession, 
        user_id: str, 
        jti: str, 
        expires_at: datetime, 
        parent_jti: Optional[str] = None
    ) -> UserRefreshTokenModel:
        token_record = UserRefreshTokenModel(
            id=str(uuid.uuid4()),
            user_id=user_id,
            token_jti=jti,
            parent_jti=parent_jti,
            expires_at=expires_at,
            is_revoked=False
        )
        session.add(token_record)
        await session.commit()
        return token_record

    async def rotate_refresh_token(
        self, 
        session: AsyncSession, 
        refresh_token_string: str
    ) -> Tuple[UserModel, str, str, str, str]:
        payload = decode_token(refresh_token_string)
        if not payload or payload.get("type") != "refresh":
            raise AuthenticationFailedException("Session signature validation failed.")

        user_id = payload.get("sub")
        jti = payload.get("jti") or payload.get("sub") # Fallback to sub if jti absent
        
        # Look up token record
        stmt = select(UserRefreshTokenModel).where(UserRefreshTokenModel.token_jti == jti)
        result = await session.execute(stmt)
        token_record = result.scalar_one_or_none()

        # Token Reuse / Abuse Detection Block
        if token_record and token_record.is_revoked:
            logger.warning(f"Detected reuse of revoked refresh token JTI: {jti}. Forcing revocation of all tokens for User : {user_id}")
            rev_all_stmt = select(UserRefreshTokenModel).where(UserRefreshTokenModel.user_id == user_id)
            all_tokens_res = await session.execute(rev_all_stmt)
            for token in all_tokens_res.scalars():
                token.is_revoked = True
                token.deleted_at = datetime.now(timezone.utc)
            await session.commit()
            raise ActionForbiddenException("Security breach warning: expired session reuse detected. Please sign in again.")

        # Load User
        user_stmt = select(UserModel).where(UserModel.id == user_id).options(
            selectinload(UserModel.role).selectinload(RoleModel.permissions)
        )
        user_res = await session.execute(user_stmt)
        user = user_res.scalar_one_or_none()
        if not user or not user.is_active:
            raise AuthenticationFailedException("User context associated with token is invalid or deactivated.")

        # Mark current token as revoked
        if token_record:
            token_record.is_revoked = True
            await session.commit()

        # Generate new dual tokens
        new_jti = str(uuid.uuid4())
        new_access = create_access_token(
            subject=user.id,
            role=user.role.name,
            permissions=[p.name for p in user.role.permissions]
        )
        new_refresh = create_refresh_token(subject=user.id)
        
        new_payload = decode_token(new_refresh)
        exp_timestamp = new_payload.get("exp")
        expires_at = datetime.fromtimestamp(exp_timestamp, tz=timezone.utc) if exp_timestamp else datetime.now(timezone.utc)

        await self.store_refresh_token(
            session=session,
            user_id=user.id,
            jti=new_jti,
            expires_at=expires_at,
            parent_jti=jti
        )

        return user, new_access, new_refresh, user.role.name, new_jti

    async def invalidate_user_tokens(self, session: AsyncSession, user_id: str) -> None:
        stmt = select(UserRefreshTokenModel).where(
            UserRefreshTokenModel.user_id == user_id,
            UserRefreshTokenModel.is_revoked == False
        )
        result = await session.execute(stmt)
        for token in result.scalars():
            token.is_revoked = True
            token.deleted_at = datetime.now(timezone.utc)
        await session.commit()
