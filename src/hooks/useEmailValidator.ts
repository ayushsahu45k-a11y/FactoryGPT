import { useState, useCallback } from "react";

export function useEmailValidator(initialValue: string = "") {
  const [rawEmail, setRawEmail] = useState(initialValue);

  const sanitizeEmail = useCallback((val: string): string => {
    return val.trim().toLowerCase();
  }, []);

  const validateEmailFormat = useCallback((emailStr: string): boolean => {
    // Standard RFC-5322 email regex pattern
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(emailStr);
  }, []);

  const email = sanitizeEmail(rawEmail);
  const isValid = email.length > 0 ? validateEmailFormat(email) : false;
  const validationError = email.length > 0 && !isValid 
    ? "INVALID SIGNATURE FORMAT: Email must comply with standard RFC-5322 address format."
    : null;

  const handleSetEmail = useCallback((val: string) => {
    // Automatically convert user email inputs to lowercase and sanitize whitespaces
    setRawEmail(val.toLowerCase().replace(/\s/g, ""));
  }, []);

  return {
    email,
    rawEmail,
    setEmail: handleSetEmail,
    isValid,
    validationError
  };
}
