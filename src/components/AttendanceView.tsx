import React from "react";
import { useStore } from "../store/useStore";
import { 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  User, 
  Fingerprint, 
  Calendar, 
  ChevronRight, 
  ShieldAlert, 
  Sparkles, 
  Award,
  Zap
} from "lucide-react";
import IndustrialWidget from "./IndustrialWidget";

// June 2026 Shift Schedule Rules definitions
interface ShiftSchedule {
  expectedStart: string;
  expectedEnd: string;
  isOff: boolean;
}

const parseTimeToMinutes = (t: string): number => {
  if (!t || !t.includes(":")) return 0;
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

const getWorkerScheduleForDay = (email: string, dayOfWeek: number): ShiftSchedule => {
  // Sunday = 0, Monday = 1 ... Saturday = 6 (since dayOfWeek = d % 7 under June 2026 Monday start)
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  if (isWeekend && !email.toLowerCase().includes("admin")) {
    return { expectedStart: "00:00", expectedEnd: "00:00", isOff: true };
  }

  // Consistent shifts based on email hashing
  const charSum = email.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const shiftType = charSum % 3; // 0: Morning Shift, 1: Swing Shift, 2: Night Shift

  if (shiftType === 0) {
    return { expectedStart: "08:00", expectedEnd: "16:00", isOff: false };
  } else if (shiftType === 1) {
    return { expectedStart: "16:00", expectedEnd: "00:00", isOff: false };
  } else {
    return { expectedStart: "00:00", expectedEnd: "08:00", isOff: false };
  }
};

export default function AttendanceView() {
  const { user, attendance, punchInWorker, punchOutWorker, history, registeredWorkers } = useStore();

  if (!user) return null;

  const [selectedWorkerEmail, setSelectedWorkerEmail] = React.useState(user.email);
  const [selectedDay, setSelectedDay] = React.useState(18); // June 18th is where mock data lives

  // Get list of unique workers filtered by authority level guidelines
  const uniqueWorkers = React.useMemo(() => {
    const list = [...registeredWorkers];
    if (user && !list.some(w => w.email.toLowerCase() === user.email.toLowerCase())) {
      list.push(user);
    }

    return list.filter((w) => {
      if (user.role === "Admin") {
        return true; // admin see attendance of evonr (everyone)
      }
      if (user.role === "Manager") {
        return w.role !== "Admin"; // manager see all of them except admins
      }
      if (user.role === "Worker") {
        return w.role === "Worker"; // worker see all attendance of worker
      }
      if (user.role === "Viewer") {
        return w.role === "Viewer"; // viewers see attendance of viewer only
      }
      return false;
    });
  }, [registeredWorkers, user]);

  React.useEffect(() => {
    if (uniqueWorkers.length > 0 && !uniqueWorkers.some(w => w.email.toLowerCase() === selectedWorkerEmail.toLowerCase())) {
      setSelectedWorkerEmail(uniqueWorkers[0].email);
    }
  }, [uniqueWorkers, selectedWorkerEmail]);

  // Find worker's current active shift punch
  const activeShift = attendance.find((a) => a.userEmail === user.email && a.status === "active");
  const completedShifts = attendance.filter((a) => a.userEmail === user.email && a.status === "completed");

  const handlePunchIn = () => {
    punchInWorker(user.email, user.full_name);
  };

  const handlePunchOut = () => {
    punchOutWorker(user.email);
  };

  // Compute stats and calendar cells for selected worker in June 2026
  const dayStats = React.useMemo(() => {
    let nominal = 0;
    let absent = 0;
    let late = 0;
    let early = 0;
    let incomplete = 0;
    let overtime = 0;
    let expectedDays = 0;

    const days = Array.from({ length: 30 }, (_, index) => {
      const d = index + 1;
      const dateStr = `2026-06-${String(d).padStart(2, "0")}`;
      const dayOfWeek = d % 7; // June 1st, 2026 is Monday
      const schedule = getWorkerScheduleForDay(selectedWorkerEmail, dayOfWeek);
      const punches = attendance.filter(a => a.userEmail === selectedWorkerEmail && a.punchIn.startsWith(dateStr));
      
      let status: "OFF" | "NOMINAL" | "ABSENT" | "LATE" | "EARLY" | "INCOMPLETE" | "OVERTIME" = "OFF";
      let desc = "";

      const schedStartMin = parseTimeToMinutes(schedule.expectedStart);
      const schedEndMin = parseTimeToMinutes(schedule.expectedEnd);

      if (schedule.isOff) {
        if (punches.length > 0) {
          status = "OVERTIME";
          overtime++;
          desc = "REST-DAY METRIC (UNSCHEDULED WORK COMPLIANCE DETECTED)";
        } else {
          status = "OFF";
          desc = "STANDARD OPERATOR RECOVERY / REST SESSION";
        }
      } else {
        expectedDays++;
        if (punches.length === 0) {
          if (d > 18) {
            status = "OFF";
            desc = "SCHEDULED FUTURE COMPLIANT SHIFT";
          } else {
            status = "ABSENT";
            absent++;
            desc = "CRITICAL DEVIATION FLAGGED: ABSENTEE ENFORCEMENT ERROR";
          }
        } else {
          const p = punches[0];
          const actualStartMin = parseTimeToMinutes(p.punchIn.slice(11, 16));
          const isLate = actualStartMin > schedStartMin + 15;
          let isEarly = false;
          const isIncomplete = p.status === "active";

          if (p.punchOut) {
            const actualEndMin = parseTimeToMinutes(p.punchOut.slice(11, 16));
            isEarly = actualEndMin < schedEndMin - 15;
          }

          if (isIncomplete) {
            if (d === 18) {
              status = "NOMINAL";
              nominal++;
              desc = `ACTIVE SHIFT IN-PROGRESS (COMMITTED INGRESS AT ${p.punchIn.slice(11, 16)})`;
            } else {
              status = "INCOMPLETE";
              incomplete++;
              desc = "DISCREPANCY DETECTED: UNFINISHED COUPLING (NO LOCK-OUT OUTBOUND SIGN-OFF)";
            }
          } else if (isLate && isEarly) {
            status = "LATE";
            late++;
            desc = "CRITICAL COUPLING DOUBLE ERROR: LATE ACCESS & INCORRECT EARLY EXIT STATED";
          } else if (isLate) {
            status = "LATE";
            late++;
            desc = `TARDY DISCREPANCY DETECTED: INBOUND GATE DELAY (ENTERED SECURE AREA AT ${p.punchIn.slice(11, 16)})`;
          } else if (isEarly) {
            status = "EARLY";
            early++;
            desc = `EARLY EXIT DISCREPANCY DETECTED: REMOVED ACTIVE COUPLING BEFORE HOURS (LEFT AT ${p.punchOut?.slice(11, 16)})`;
          } else {
            status = "NOMINAL";
            nominal++;
            desc = "NOMINAL COMPLIANT OPERATION";
          }
        }
      }

      return {
        day: d,
        dateStr,
        status,
        description: desc,
        schedule,
        punches,
      };
    });

    return {
      days,
      nominal,
      absent,
      late,
      early,
      incomplete,
      overtime,
      expectedDays,
    };
  }, [selectedWorkerEmail, attendance]);

  const inspectedDayData = React.useMemo(() => {
    return dayStats.days.find(d => d.day === selectedDay);
  }, [dayStats, selectedDay]);

  return (
    <div className="space-y-6">
      {/* Heavy-Duty Punch card board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <IndustrialWidget
            title="OFFICIAL COBALT INDUSTRIAL SHIFT REGISTRY"
            subtitle="Secure RFID Punch Terminal for Industrial Personnel Shifts"
            headerAction={
              <span className="text-[9px] font-mono text-zinc-400 bg-zinc-950 px-2 py-0.5 border border-border-machina font-black">
                STATION_ID: CR12_PORTAL
              </span>
            }
          >
            <div className="p-5 bg-[#0F0F0D] border border-border-machina rounded-[2px] font-mono">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                
                {/* Active user state box */}
                <div className="space-y-2 text-center md:text-left">
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <User size={16} className="text-accent-machina" />
                    <span className="text-xs text-text-secondary uppercase">OPERATIVE PROFILE:</span>
                  </div>
                  <h3 className="text-lg font-black text-text-primary uppercase leading-none">
                    {user.full_name}
                  </h3>
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <span className="text-[10px] bg-card-machina px-2 py-0.5 border border-border-machina text-accent-machina font-bold">
                      {user.role}
                    </span>
                    <span className="text-[9px] text-zinc-500 font-bold">
                      {user.email.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Big tactical punch mechanism */}
                <div className="bg-card-machina border border-border-machina p-4 rounded-[3px] text-center w-full md:w-auto">
                  {activeShift ? (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <span className="text-[8px] text-text-secondary block font-bold tracking-widest">// SHIFT ACTIVE & SECURITY ARMED</span>
                        <div className="text-emerald-400 text-sm font-semibold flex items-center justify-center gap-1">
                          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                          <span>ACTIVE SINCE: {activeShift.punchIn.slice(11, 19)}</span>
                        </div>
                        <span className="text-[8px] text-zinc-500 block">SAFETY GATEWAY: {activeShift.safetyCleared ? "CLRD ✔" : "PENDING SCAN ✖"}</span>
                      </div>
                      
                      <button
                        onClick={handlePunchOut}
                        className="w-full md:w-48 py-2 bg-danger-machina hover:bg-white text-bg-machina hover:text-bg-machina text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer rounded-[1px]"
                      >
                        PUNCH OUT VALUE
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <span className="text-[8px] text-text-secondary block font-bold tracking-widest">// NO ACTIVE COUPLING SHIFT DETECTED</span>
                        <span className="text-zinc-500 text-xs block font-black uppercase">STATUS Code: STANDBY</span>
                      </div>
                      
                      <button
                        onClick={handlePunchIn}
                        className="w-full md:w-48 py-2 bg-accent-machina hover:bg-white text-bg-machina text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer rounded-[1px]"
                      >
                        PUNCH IN TO SHIFT
                      </button>
                    </div>
                  )}
                </div>

              </div>

              {/* Attendance compliance instructions warning panel */}
              <div className="mt-5 border-t border-border-machina/60 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-[9.5px] text-text-secondary leading-relaxed">
                <div className="flex gap-2">
                  <Fingerprint size={16} className="text-zinc-500 shrink-0" />
                  <p>
                    <span className="font-bold text-text-primary block uppercase">// 1. REGULATION GATE CHECK-IN:</span>
                    All workers must perform a biosequential face-and-gear compliance scan within 15 minutes of shift sign-on to authorize access into active areas.
                  </p>
                </div>
                <div className="flex gap-2">
                  <AlertCircle size={16} className="text-zinc-500 shrink-0" />
                  <p>
                    <span className="font-bold text-text-primary block uppercase">// 2. ENFORCER LOCKOUT PROTOCOL:</span>
                    Failure to complete checkups triggers immediate lockout tickets. Sirens will lock out other commands automatically until resolved.
                  </p>
                </div>
              </div>
            </div>
          </IndustrialWidget>

          {/* Premium High-Fidelity Shift Calendar */}
          <IndustrialWidget
            title="FACILITY COOPERATIVE SHIFT & ATTENDANCE CALENDAR"
            subtitle="Deep comparative calendar matrix displaying schedule expectations vs real physical punches (June 2026)"
          >
            <div className="p-4 bg-[#0F0F0D] border border-border-machina rounded-[2px]">
              
              {/* Active selection bar */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 border-b border-border-machina/60 pb-4">
                <div className="space-y-1.5 w-full md:w-auto">
                  <span className="text-[8px] text-zinc-500 font-bold block tracking-widest uppercase">SELECT OPERATIVE SHIFT TO AUDIT:</span>
                  <select
                    value={selectedWorkerEmail}
                    onChange={(e) => {
                      setSelectedWorkerEmail(e.target.value);
                      setSelectedDay(18); // Reset selected day to clear safe inspector
                    }}
                    className="w-full md:w-80 bg-zinc-950 border border-border-machina text-[10.5px] font-black text-accent-machina py-1.5 px-3 uppercase outline-none cursor-pointer focus:border-accent-machina rounded-[1px]"
                  >
                    {uniqueWorkers.map(w => (
                      <option key={w.id} value={w.email}>
                        {w.full_name} — {w.role.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dashboard Summary indicators */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto text-[8.5px] font-mono">
                  <div className="p-2 bg-zinc-950 border border-border-machina flex flex-col justify-between min-w-[90px]">
                    <span className="text-zinc-500 text-[7px] uppercase font-bold">NOMINAL</span>
                    <span className="text-emerald-400 font-extrabold text-xs mt-1">{dayStats.nominal} Days</span>
                  </div>
                  <div className="p-2 bg-zinc-950 border border-border-machina flex flex-col justify-between min-w-[90px]">
                    <span className="text-zinc-500 text-[7px] uppercase font-bold">LATENCY</span>
                    <span className="text-amber-400 font-extrabold text-xs mt-1">{dayStats.late + dayStats.early} Days</span>
                  </div>
                  <div className="p-2 bg-zinc-950 border border-border-machina flex flex-col justify-between min-w-[90px]">
                    <span className="text-zinc-500 text-[7px] uppercase font-bold">ABSENCES</span>
                    <span className="text-danger-machina font-extrabold text-xs mt-1">{dayStats.absent} Days</span>
                  </div>
                  <div className="p-2 bg-zinc-950 border border-border-machina flex flex-col justify-between min-w-[90px]">
                    <span className="text-zinc-500 text-[7px] uppercase font-bold">OVERTIME</span>
                    <span className="text-sky-400 font-extrabold text-xs mt-1">{dayStats.overtime} Days</span>
                  </div>
                </div>
              </div>

              {/* Column headings */}
              <div className="grid grid-cols-7 gap-1 text-center font-bold text-[8.5px] text-zinc-500 mb-2 uppercase tracking-widest font-mono">
                <div>MON</div>
                <div>TUE</div>
                <div>WED</div>
                <div>THU</div>
                <div>FRI</div>
                <div>SAT</div>
                <div>SUN</div>
              </div>

              {/* Calendar Grid map (30 Days of June 2026, perfectly starting on Monday June 1) */}
              <div className="grid grid-cols-7 gap-1.5 font-mono">
                {dayStats.days.map((dayData) => {
                  const isSelected = selectedDay === dayData.day;
                  
                  let borderCls = "border-border-machina bg-zinc-950/40 text-zinc-500";
                  let indicatorCls = "bg-zinc-800";
                  let flagAbbreviation = "";

                  if (dayData.status === "NOMINAL") {
                    borderCls = isSelected ? "border-emerald-500 bg-emerald-950/20 text-emerald-400" : "border-emerald-900 bg-emerald-950/10 text-emerald-400/80 hover:border-emerald-700";
                    indicatorCls = "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]";
                    flagAbbreviation = "OK";
                  } else if (dayData.status === "ABSENT") {
                    borderCls = isSelected ? "border-red-500 bg-red-950/20 text-danger-machina" : "border-red-950 bg-red-950/10 text-danger-machina/80 hover:border-red-800";
                    indicatorCls = "bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.3)]";
                    flagAbbreviation = "ABS";
                  } else if (dayData.status === "LATE" || dayData.status === "EARLY") {
                    borderCls = isSelected ? "border-amber-500 bg-amber-950/20 text-amber-400" : "border-amber-900 bg-amber-950/10 text-amber-400/80 hover:border-amber-700";
                    indicatorCls = "bg-amber-500";
                    flagAbbreviation = dayData.status === "LATE" ? "LAT" : "ERL";
                  } else if (dayData.status === "INCOMPLETE" || dayData.status === "OVERTIME") {
                    borderCls = isSelected ? "border-orange-500 bg-orange-950/20 text-orange-400" : "border-orange-900 bg-orange-950/10 text-orange-400/80 hover:border-orange-700";
                    indicatorCls = "bg-orange-500 animate-pulse";
                    flagAbbreviation = dayData.status === "INCOMPLETE" ? "INC" : "OVT";
                  } else if (dayData.status === "OFF") {
                    if (dayData.day > 18) {
                      borderCls = isSelected ? "border-zinc-500 bg-zinc-900/30 text-zinc-400" : "border-zinc-800/50 bg-zinc-950/10 text-zinc-650 hover:border-zinc-700";
                      indicatorCls = "bg-zinc-800";
                    } else {
                      borderCls = isSelected ? "border-zinc-500 bg-zinc-900/40 text-zinc-300" : "border-zinc-800 bg-zinc-950/10 text-zinc-500 hover:border-zinc-700";
                      indicatorCls = "bg-zinc-850";
                      flagAbbreviation = "REST";
                    }
                  }

                  return (
                    <button
                      key={dayData.day}
                      onClick={() => setSelectedDay(dayData.day)}
                      type="button"
                      className={`p-2.5 border rounded-[1px] relative text-left transition-all cursor-pointer select-none group min-h-[58px] flex flex-col justify-between ${borderCls}`}
                    >
                      <div className="flex justify-between items-start w-full">
                        <span className="text-[10.5px] font-black">{dayData.day}</span>
                        {flagAbbreviation ? (
                          <span className="text-[6px] font-black px-1 py-0.2 bg-black/60 border border-border-machina tracking-wide select-none origin-right scale-[0.9]">
                            {flagAbbreviation}
                          </span>
                        ) : (
                          <span className={`w-1.5 h-1.5 rounded-full ${indicatorCls}`}></span>
                        )}
                      </div>
                      
                      <div className="mt-1">
                        {dayData.schedule.isOff ? (
                          <span className="text-[6.5px] text-zinc-500 font-mono scale-[0.9] origin-left block uppercase">HOLIDAY</span>
                        ) : (
                          <span className="text-[6.5px] font-bold text-zinc-400 font-mono scale-[0.88] origin-left block uppercase">
                            {dayData.schedule.expectedStart}-{dayData.schedule.expectedEnd}
                          </span>
                        )}
                        {dayData.punches.length > 0 && (
                          <span className="text-[6.5px] text-accent-machina block font-bold mt-0.5 font-mono scale-[0.85] origin-left uppercase">
                            ACT: {dayData.punches[0].punchIn.slice(11, 16)}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Interactive Day Inspector / Comparative hourly timeline widget */}
              {inspectedDayData && (
                <div className="mt-5 p-4 bg-zinc-950/60 border border-border-machina rounded-[1px] font-mono animate-fade-in">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                    <div className="space-y-0.5">
                      <span className="text-[8px] text-zinc-500 font-black block tracking-widest">// DAY DIGITAL COMPARATOR PATHWAY</span>
                      <h4 className="text-[11.5px] font-black text-text-primary uppercase flex items-center gap-1">
                        <Calendar size={12} className="text-accent-machina" />
                        <span>TACTICAL TIMELINE AUDIT: JUNE {selectedDay}, 2026</span>
                      </h4>
                    </div>
                    
                    <div className="px-2.5 py-0.5 bg-card-machina border border-border-machina flex items-center gap-1.5 text-[8.5px] font-black uppercase tracking-wider rounded-[1px]">
                      <span className="text-zinc-500 font-bold">DEVIATION CODE:</span>
                      {inspectedDayData.status === "NOMINAL" && <span className="text-emerald-400 font-black">✔ NOMINAL COMPLIANCE</span>}
                      {inspectedDayData.status === "ABSENT" && <span className="text-danger-machina font-black animate-pulse">✖ ABSENT DISCREPANCY DETECTED</span>}
                      {inspectedDayData.status === "LATE" && <span className="text-amber-400 font-black">▲ LATE GATE INTERCEPT</span>}
                      {inspectedDayData.status === "EARLY" && <span className="text-amber-400 font-black">▼ PREMATURE EXIT EXCEPTION</span>}
                      {inspectedDayData.status === "INCOMPLETE" && <span className="text-orange-400 font-black">▲ OUTBOUND REGISTRY VACANT</span>}
                      {inspectedDayData.status === "OVERTIME" && <span className="text-sky-450 font-black">▲ UNSCHEDULED COUPLING</span>}
                      {inspectedDayData.status === "OFF" && <span className="text-zinc-500">○ STANDARD REST</span>}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Discrepancy details card */}
                    <div className="p-3 bg-zinc-900 border border-border-machina/80 text-[10px] uppercase font-bold text-text-secondary flex items-start gap-2.5">
                      <AlertCircle size={14} className="text-accent-machina shrink-0 mt-0.5" />
                      <div>
                        <span className="text-zinc-500 text-[8px] block tracking-wide font-black uppercase">// TELEMETRY DIAGNOSIS NARRATIVE:</span>
                        <p className="text-text-primary font-bold mt-1 leading-normal uppercase">{inspectedDayData.description}</p>
                      </div>
                    </div>

                    {/* Timeline visualization maps */}
                    <div className="space-y-3 pt-2">
                      <div className="flex justify-between text-[7.5px] text-zinc-500 font-black px-1.5">
                        <span>00:00 (MIDNIGHT)</span>
                        <span>04:00</span>
                        <span>08:00 (MORNING)</span>
                        <span>12:00 (NOON)</span>
                        <span>16:00 (EVENING)</span>
                        <span>20:00</span>
                        <span>24:00 (MIDNIGHT)</span>
                      </div>

                      {/* Expected timeline */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[8px] text-zinc-400">
                          <span className="font-black flex items-center gap-1">// EXPECTED OPERATING PATTERN:</span>
                          <span className="font-bold text-zinc-300">
                            {inspectedDayData.schedule.isOff 
                              ? "STANDARD OFF DAY (REST CYCLE)" 
                              : `SHIFT SCHEDULE TIME: ${inspectedDayData.schedule.expectedStart} — ${inspectedDayData.schedule.expectedEnd}`}
                          </span>
                        </div>
                        <div className="h-5 bg-zinc-950 border border-border-machina/60 relative overflow-hidden rounded-[1px]">
                          {!inspectedDayData.schedule.isOff && (
                            <div 
                              className="absolute top-0 bottom-0 bg-sky-950/40 border-l border-r border-sky-400/50 flex items-center justify-center"
                              style={{
                                left: `${(parseTimeToMinutes(inspectedDayData.schedule.expectedStart) / 1440) * 100}%`,
                                width: `${((parseTimeToMinutes(inspectedDayData.schedule.expectedEnd) - parseTimeToMinutes(inspectedDayData.schedule.expectedStart)) / 1440) * 100}%`
                              }}
                            >
                              <span className="text-[7.5px] font-black text-sky-400 tracking-widest uppercase">SCHEDULE CHANNEL</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actual timeline */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[8px] text-zinc-400">
                          <span className="font-black flex items-center gap-1">// PHYSICAL GATE PUNCH EVIDENCE:</span>
                          <span className="font-bold text-zinc-300">
                            {inspectedDayData.punches.length === 0 
                              ? "RFID RECORD VACANT" 
                              : `SIGN-ON: ${inspectedDayData.punches[0].punchIn.slice(11, 16)} — REST SIGN-OFF: ${inspectedDayData.punches[0].punchOut?.slice(11, 16) || "TERMINAL INGRESS STILL ENGAGED"}`}
                          </span>
                        </div>
                        <div className="h-5 bg-zinc-950 border border-border-machina/60 relative overflow-hidden rounded-[1px]">
                          {inspectedDayData.punches.length > 0 && (() => {
                            const p = inspectedDayData.punches[0];
                            const startM = parseTimeToMinutes(p.punchIn.slice(11, 16));
                            let endM = p.punchOut ? parseTimeToMinutes(p.punchOut.slice(11, 16)) : startM + 480;
                            if (p.status === "active" && selectedDay === 18) {
                              endM = 1440;
                            }
                            const left = (startM / 1440) * 100;
                            const width = Math.max(2, ((endM - startM) / 1440) * 100);
                            
                            let barColor = "bg-emerald-950/50 border-emerald-500/80 text-emerald-400";
                            if (inspectedDayData.status === "ABSENT") {
                              barColor = "bg-red-950/50 border-red-500/80 text-red-400";
                            } else if (inspectedDayData.status === "LATE" || inspectedDayData.status === "EARLY") {
                              barColor = "bg-amber-950/50 border-amber-500/80 text-amber-400";
                            } else if (inspectedDayData.status === "INCOMPLETE") {
                              barColor = "bg-orange-950/50 border-orange-500/80 text-orange-400";
                            }

                            return (
                              <div 
                                className={`absolute top-0 bottom-0 border-l border-r flex items-center justify-center ${barColor}`}
                                style={{ left: `${left}%`, width: `${width}%` }}
                              >
                                <span className="text-[7.5px] font-black tracking-widest uppercase">
                                  {p.status === "active" ? "INTEGRATING ACTIVE SESSION" : "COUPLED SIGNAL RECORD"}
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </IndustrialWidget>

          {/* User shift ledger card */}
          <IndustrialWidget
            title="OPERATIVE RECENT SHIFT HISTORY"
            subtitle="Verified Ledger Audit Trails for current operator"
          >
            <div className="bg-[#0F0F0D] border border-border-machina rounded-[2px] overflow-hidden">
              <table className="w-full border-collapse font-mono text-[9px] text-left">
                <thead>
                  <tr className="bg-card-machina border-b border-border-machina text-text-secondary">
                    <th className="py-2.5 px-4 font-black">SHIFT ID</th>
                    <th className="py-2.5 px-4 font-black">PUNCH IN TIME</th>
                    <th className="py-2.5 px-4 font-black">PUNCH OUT TIME</th>
                    <th className="py-2.5 px-4 font-black">DURATION</th>
                    <th className="py-2.5 px-4 font-black">SAFETY INGEST</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-machina/40">
                  {completedShifts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-text-secondary uppercase">
                        No shifts completed in current record registry.
                      </td>
                    </tr>
                  ) : (
                    completedShifts.map((sh, idx) => {
                      const minutes = Math.round((new Date(sh.punchOut || "").getTime() - new Date(sh.punchIn).getTime()) / 60000);
                      return (
                        <tr key={sh.id} className="hover:bg-card-machina font-bold text-text-primary animate-fade-in">
                          <td className="py-2.5 px-4 text-zinc-500">#{completedShifts.length - idx}</td>
                          <td className="py-2.5 px-4">{sh.punchIn.slice(0, 10)} {sh.punchIn.slice(11, 19)}</td>
                          <td className="py-2.5 px-4">{sh.punchOut?.slice(0, 10)} {sh.punchOut?.slice(11, 19)}</td>
                          <td className="py-2.5 px-4 text-accent-machina">{minutes} minutes</td>
                          <td className="py-2.5 px-4">
                            {sh.safetyCleared ? (
                              <span className="text-emerald-400">PASSED APPROVED✔</span>
                            ) : (
                              <span className="text-zinc-500">DEV UNCHECKED✖</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </IndustrialWidget>
        </div>

        {/* Right column: Local system logs & notifications */}
        <div className="space-y-6">
          <IndustrialWidget
            title="SECURITY LOGS FEED"
            subtitle="Dynamic action stream mapped on active email key"
          >
            <div className="bg-[#0F0F0D] border border-border-machina p-4 font-mono space-y-4 rounded-[2px] max-h-[580px] overflow-y-auto">
              <span className="text-[8px] text-accent-machina font-black uppercase tracking-wider block">// SESSION TRANSACTION BOUNDARIES:</span>
              
              <div className="space-y-3 text-[9.5px]">
                {history
                  .filter((h) => h.userEmail === user.email)
                  .slice(0, 8)
                  .map((log) => (
                    <div key={log.id} className="p-3 bg-card-machina border border-border-machina space-y-1.5 hover:border-zinc-700 transition-colors rounded-[1px] animate-fade-in">
                      <div className="flex justify-between items-center text-[8px] text-text-secondary">
                        <span className="bg-zinc-950 px-1 py-0.2 border border-border-machina text-zinc-400 font-bold uppercase">{log.category}</span>
                        <span>{log.timestamp.slice(11, 19)}</span>
                      </div>
                      <span className="block font-black text-text-primary uppercase leading-tight">{log.title}</span>
                      <p className="text-text-secondary font-bold leading-normal uppercase">{log.description}</p>
                    </div>
                  ))}

                {history.filter((h) => h.userEmail === user.email).length === 0 && (
                  <div className="text-center py-6 text-text-secondary uppercase">
                    No session records in live historical memory.
                  </div>
                )}
              </div>
            </div>
          </IndustrialWidget>
        </div>
      </div>
    </div>
  );
}
