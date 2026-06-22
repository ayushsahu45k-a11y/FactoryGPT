import React, { useState, useEffect, useRef } from "react";
import { useStore } from "../store/useStore";
import { SafetyIncident } from "../types";
import IndustrialWidget from "./IndustrialWidget";
import IronNutButton from "./IronNutButton";
import { alarmEngine } from "../lib/audio";
import { 
  ShieldAlert, 
  ShieldCheck, 
  Eye, 
  Settings, 
  CheckCircle,
  Wind,
  Flame,
  Zap,
  User,
  PowerOff,
  Shield,
  Fingerprint,
  Footprints,
  Sparkles,
  Award,
  Video,
  VideoOff,
  Maximize2,
  Minimize2
} from "lucide-react";

export default function SafetyView() {
  const { incidents, acknowledgeIncident, addIncident, user, setSafetyCleared, punchInWorker, history, addHistory } = useStore();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [gasThreshold, setGasThreshold] = useState(10.0); // max allowed Argon gas ppm
  const [tempThreshold, setTempThreshold] = useState(85.0); // max allowed bearing temp
  const [videoFeedWorkerName, setVideoFeedWorkerName] = useState(user?.full_name || "Technician S. Carter");
  
  // Interactive Plant-floor walkdown Audit checks (ISO 9001, ISO 14001, OSHA)
  const [walkdownCatwalks, setWalkdownCatwalks] = useState(true);
  const [walkdownGlassPaths, setWalkdownGlassPaths] = useState(true);
  const [walkdownVoltageShields, setWalkdownVoltageShields] = useState(true);
  const [walkdownCryoConduits, setWalkdownCryoConduits] = useState(true);
  const [walkdownSirens, setWalkdownSirens] = useState(true);
  
  // Custom PPE compliance checkboxes state
  const [workerHardhat, setWorkerHardhat] = useState(true);
  const [workerShield, setWorkerShield] = useState(true);
  const [workerSuit, setWorkerSuit] = useState(true);
  const [workerGloves, setWorkerGloves] = useState(true);
  const [workerBoots, setWorkerBoots] = useState(true);

  // Webcam stream state
  const [usePhysicalCamera, setUsePhysicalCamera] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // OpenCV real-time video buffer processing states
  const cvCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cvMode, setCvMode] = useState<"raw" | "edges" | "color-range">("edges");
  const [cvTrackColor, setCvTrackColor] = useState<"yellow" | "blue" | "red">("yellow");
  const [autoSyncCv, setAutoSyncCv] = useState(false);
  const [cvStatus, setCvStatus] = useState({
    motion: 0,
    helmetConf: 0,
    suitConf: 0,
    glovesConf: 0,
    bootsConf: 0,
    hueTarget: 45,
    fps: 0,
  });

  // Scanner machine sequence state
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState("");
  const [scanResult, setScanResult] = useState<"none" | "success" | "failure">("none");
  const [shownQuote, setShownQuote] = useState("");
  const [missingItemsList, setMissingItemsList] = useState<string[]>([]);

  // Derived safety walkdown audit status
  const walkdownScore = React.useMemo(() => {
    const list = [walkdownCatwalks, walkdownGlassPaths, walkdownVoltageShields, walkdownCryoConduits, walkdownSirens];
    const ticks = list.filter(Boolean).length;
    return Math.round((ticks / list.length) * 100);
  }, [walkdownCatwalks, walkdownGlassPaths, walkdownVoltageShields, walkdownCryoConduits, walkdownSirens]);

  const handleAuditReportSubmit = () => {
    alarmEngine.playSuccessChime();
    if (addHistory) {
      addHistory(
        "SAFETY_SCAN",
        "ISO CENTRAL COMPLIANCE AUDIT LOCKED",
        `Manual safety walkdown completed by ${user?.full_name || "Inspector S. Carter"}. Score: ${walkdownScore}%. Status: ${walkdownScore === 100 ? "FULLY COMPLIANT" : "MINOR DEFICIENCIES NOTED"}.`
      );
    }
    alarmEngine.announceEmergencyVoice(
      `Emergency announcer. Safety walkdown audit successfully submitted. Plant rating is ${walkdownScore} percent.`
    );
  };

  // Active gas sensor monitoring values
  const gasReadingArgon = 7.4;
  const gasReadingMonoxide = 1.2;

  // Handle webcam initialization
  const toggleWebcam = async () => {
    if (usePhysicalCamera) {
      // Disconnect camera
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
      setMediaStream(null);
      setUsePhysicalCamera(false);
      setCameraError(null);
    } else {
      try {
        setCameraError(null);
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setMediaStream(stream);
        setUsePhysicalCamera(true);
      } catch (err) {
        setCameraError("COBALT HW ERROR: Could not access local camera unit. Standardizing on simulated optical wireframe feed.");
        setUsePhysicalCamera(false);
      }
    }
  };

  // Sync stream to video tag
  useEffect(() => {
    if (usePhysicalCamera && videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [usePhysicalCamera, mediaStream, isFullscreen]);

  // Cleanup webcam stream on unmount
  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [mediaStream]);

  // Real-time canvas direct computer vision loop
  useEffect(() => {
    let animationId: number;
    let lastFrameTime = performance.now();
    let frameCount = 0;
    let previousGrayscale: Uint8ClampedArray | null = null;

    const processFrame = () => {
      if (!usePhysicalCamera || !videoRef.current || !cvCanvasRef.current) {
        animationId = requestAnimationFrame(processFrame);
        return;
      }

      const video = videoRef.current;
      if (video.readyState < 2) {
        animationId = requestAnimationFrame(processFrame);
        return;
      }

      const canvas = cvCanvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        animationId = requestAnimationFrame(processFrame);
        return;
      }

      const width = canvas.width;
      const height = canvas.height;

      // Draw the active video frame to our viewport canvas
      ctx.drawImage(video, 0, 0, width, height);
      
      let frame;
      try {
        frame = ctx.getImageData(0, 0, width, height);
      } catch (e) {
        // Handle cross-origin or canvas blockages
        animationId = requestAnimationFrame(processFrame);
        return;
      }

      const data = frame.data;

      // Classifiers: Color segment values
      let yellowCount = 0; 
      let blueCount = 0;   
      let gloveCount = 0; 

      const grayBuffer = new Uint8ClampedArray(width * height);

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i+1];
        const b = data[i+2];

        // Luma conversion for grayscale edge / motion delta calculation
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        const pixelIdx = i / 4;
        grayBuffer[pixelIdx] = gray;

        // YELLOW color tag detection: High Red & High Green, Low Blue
        if (r > 105 && g > 95 && b < 70) {
          yellowCount++;
        }
        // BLUE/CYAN suit tag detection: High Blue/Teal, Low Red
        if (b > 100 && g > 80 && r < 90) {
          blueCount++;
        }
        // RED/ORANGE glove tag detection: High Red, low Green & Blue
        if (r > 120 && g < 80 && b < 80) {
          gloveCount++;
        }
      }

      // Frame difference calculation for real interactive motion tracking
      let motionScore = 0;
      if (previousGrayscale) {
        let diffSum = 0;
        for (let j = 0; j < grayBuffer.length; j++) {
          diffSum += Math.abs(grayBuffer[j] - previousGrayscale[j]);
        }
        motionScore = diffSum / grayBuffer.length;
      }
      previousGrayscale = grayBuffer;

      // Map to responsive UI metric boundaries
      const currentMotion = Math.min(100, Math.round(motionScore * 3.5));
      const totalPixels = width * height;
      
      // Calculate individual confidence profiles
      const helmetConfVal = Math.min(100, Math.round((yellowCount / (totalPixels * 0.08)) * 100));
      const suitConfVal = Math.min(100, Math.round((blueCount / (totalPixels * 0.12)) * 100));
      const glovesConfVal = Math.min(100, Math.round((gloveCount / (totalPixels * 0.06)) * 100));
      const bootsConfVal = Math.min(100, Math.round((glovesConfVal * 0.7) + (currentMotion * 0.3)));

      const now = performance.now();
      frameCount++;
      let currentFps = cvStatus.fps;
      if (now - lastFrameTime >= 1000) {
        currentFps = Math.round((frameCount * 1000) / (now - lastFrameTime));
        frameCount = 0;
        lastFrameTime = now;
      }

      // OpenCV filtering simulations in canvas
      if (cvMode === "edges") {
        const edgeData = ctx.createImageData(width, height);
        for (let y = 1; y < height - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            const idx = y * width + x;
            
            // Sobel spatial convolution approximation
            const valX = 
              - grayBuffer[(y-1)*width + x-1] + grayBuffer[(y-1)*width + x+1]
              - 2 * grayBuffer[y*width + x-1] + 2 * grayBuffer[y*width + x+1]
              - grayBuffer[(y+1)*width + x-1] + grayBuffer[(y+1)*width + x+1];
            const valY = 
              - grayBuffer[(y-1)*width + x-1] - 2 * grayBuffer[(y-1)*width + x] - grayBuffer[(y-1)*width + x+1]
              + grayBuffer[(y+1)*width + x-1] + 2 * grayBuffer[(y+1)*width + x] + grayBuffer[(y+1)*width + x+1];
            
            const magnitude = Math.sqrt(valX*valX + valY*valY);
            const targetColorIdx = idx * 4;

            if (magnitude > 35) {
              // High contrast copper edge matrix #C4A484
              edgeData.data[targetColorIdx] = 196;
              edgeData.data[targetColorIdx+1] = 164;
              edgeData.data[targetColorIdx+2] = 132;
              edgeData.data[targetColorIdx+3] = 255;
            } else {
              edgeData.data[targetColorIdx] = 15;
              edgeData.data[targetColorIdx+1] = 15;
              edgeData.data[targetColorIdx+2] = 13;
              edgeData.data[targetColorIdx+3] = 255;
            }
          }
        }
        ctx.putImageData(edgeData, 0, 0);
      } else if (cvMode === "color-range") {
        // HSV-lookalike isolation filter
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i+1];
          const b = data[i+2];

          let filterPass = false;
          if (cvTrackColor === "yellow") {
            filterPass = (r > 105 && g > 95 && b < 70);
          } else if (cvTrackColor === "blue") {
            filterPass = (b > 100 && g > 80 && r < 90);
          } else if (cvTrackColor === "red") {
            filterPass = (r > 120 && g < 80 && b < 80);
          }

          if (!filterPass) {
            // Apply heavy desaturation and ambient dark factor to background
            const luma = 0.299 * r + 0.587 * g + 0.114 * b;
            data[i] = luma * 0.15;
            data[i+1] = luma * 0.15;
            data[i+2] = luma * 0.15;
          }
        }
        ctx.putImageData(frame, 0, 0);
      }

      // If AutoSync is operational, synchronize live calculations directly into safety switches
      if (autoSyncCv) {
        if (helmetConfVal > 22) {
          setWorkerHardhat(true);
          setWorkerShield(true);
        } else {
          setWorkerHardhat(false);
          setWorkerShield(false);
        }

        if (suitConfVal > 18) {
          setWorkerSuit(true);
        } else {
          setWorkerSuit(false);
        }

        if (glovesConfVal > 15) {
          setWorkerGloves(true);
          setWorkerBoots(true);
        } else {
          setWorkerGloves(false);
          setWorkerBoots(false);
        }
      }

      setCvStatus({
        motion: currentMotion,
        helmetConf: helmetConfVal,
        suitConf: suitConfVal,
        glovesConf: glovesConfVal,
        bootsConf: bootsConfVal,
        hueTarget: cvTrackColor === "yellow" ? 45 : cvTrackColor === "blue" ? 210 : 0,
        fps: currentFps,
      });

      animationId = requestAnimationFrame(processFrame);
    };

    if (usePhysicalCamera) {
      animationId = requestAnimationFrame(processFrame);
    }

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [usePhysicalCamera, cvMode, cvTrackColor, autoSyncCv, cvStatus.fps, isFullscreen]);

  // Real-time Complex AI Optical Scanner sequence
  const startRealtimeOpticalScan = () => {
    setIsScanning(true);
    setScanResult("none");
    setScanStep("BIOMETRIC_LOCK: SCANNER INGESTS TARGET PROFILE...");

    // Step-by-step scanner visualization
    setTimeout(() => {
      setScanStep("OPTICAL_SWEEP: DETECTING STEEL-GUARD HELMET...");
    }, 400);

    setTimeout(() => {
      setScanStep("INTELLIGENT_RECOG: ANALYZING INSULATION SUIT BOUNDARY...");
    }, 800);

    setTimeout(() => {
      setScanStep("VOLTAGE_CHECK: ESTIMATING HIGH-TENSION GRIP GLOVES...");
    }, 1200);

    setTimeout(() => {
      setScanStep("TRACTION_VAL: CHECKING ANTI-SLIP REINFORCED BOOTS...");
    }, 1500);

    // Scan Final Resolution
    setTimeout(() => {
      setIsScanning(false);
      
      const missing: string[] = [];
      if (!workerHardhat) missing.push("Helmet");
      if (!workerShield) missing.push("Eye-protection Guard");
      if (!workerSuit) missing.push("Thermal Suit Shield");
      if (!workerGloves) missing.push("Heavy Work Gloves");
      if (!workerBoots) missing.push("Ground-static Boots");

      if (missing.length > 0) {
        setScanResult("failure");
        setMissingItemsList(missing);
        
        // Fail sirens trigger instantly
        alarmEngine.startSiren();
        
        const breachMsg = `OPTICAL THREAT TRIGGER: worker entered checkup zone with a safety wearing deficit. missing items: [${missing.join(", ").toUpperCase()}]. checkup process denied.`;
        const inc: SafetyIncident = {
          id: `inc-breach-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          zone: "Zone Alpha Main Portal",
          category: "PPE Breach",
          message: breachMsg,
          level: "emergency", // A very distinct red alert layout
          timestamp: new Date().toISOString(),
          acknowledged: false
        };
        addIncident(inc);

        if (addHistory) {
          addHistory(
            "SAFETY_SCAN",
            "OPTICAL PPE BREACH RECORDED",
            `Operative "${videoFeedWorkerName.toUpperCase()}" failed laser safety compliance check. Missing apparel segments: [${missing.join(", ").toUpperCase()}]. Gate clearance locked.`
          );
        }
      } else {
        setScanResult("success");
        setMissingItemsList([]);
        alarmEngine.playSuccessChime();
        alarmEngine.stopSiren(); // Shut off sirens if safety cleared

        // Randomized beautiful compliance quote as requested by the user:
        const quotes = [
          "Hope !! Have a good day. Safety is our iron priority.",
          "Hope !! Everything is tightly secure. Have a exceptional day at work!",
          "Hope !! Compliance checked. Have a wonderful and risk-free shift!",
          "Hope !! Safety gear functional. Let's build with precision!"
        ];
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        setShownQuote(randomQuote);

        if (addHistory) {
          addHistory(
            "SAFETY_SCAN",
            "OPTICAL PPE COMPLIANCE CLEARED",
            `Operative "${videoFeedWorkerName.toUpperCase()}" passed biometric & safety apparel check. Status: 100% compliant. Gate access granted.`
          );
        }

        // Update store records
        if (user) {
          setSafetyCleared(user.email, true);
          punchInWorker(user.email, user.full_name);
        }
      }
    }, 2100);
  };

  if (isFullscreen) {
    return (
      <div id="safety-view-fullscreen-overlay" className="fixed inset-0 z-[10005] w-screen h-screen bg-[#0C0C0B] flex flex-col md:flex-row border-4 border-accent-machina select-none font-mono overflow-hidden">
        {/* LEFT COLUMN: VISUAL SATELLITE RADAR FEED */}
        <div className="flex-1 relative bg-black/45 overflow-hidden h-full flex flex-col justify-between p-6">
          {/* Hardware Connection Error Diagnostic Overlay */}
          {cameraError && (
            <div className="absolute inset-0 bg-[#0c0c0bfa] backdrop-blur-sm z-30 flex flex-col justify-between p-5 border-2 border-red-950/70 font-mono">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-red-500 font-extrabold uppercase text-[10px] border-b border-red-950/60 pb-1.5">
                  <ShieldAlert size={14} className="animate-pulse" />
                  <span>Hardware Access Exception</span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-normal">
                  {cameraError}
                </p>
                <div className="bg-zinc-950 border border-red-950/30 p-2.5 rounded-[1px] space-y-1.5 text-[8.5px] text-zinc-500">
                  <span className="block font-bold text-zinc-400 uppercase">// TECHNICAL DIAGNOSTICS & FIX:</span>
                  <p className="leading-relaxed">
                    1. <strong className="text-accent-machina">Iframe Sandboxing</strong>: Standard web browsers strictly block hardware device requests (camera and microphone streams) inside secure iframes.
                  </p>
                  <p className="leading-relaxed">
                    2. <strong className="text-accent-machina">Solution</strong>: Click the <strong className="text-white">"Open in New Tab"</strong> button in the upper right-hand corner of the environment to grant direct hardware access.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2.5">
                <button
                  onClick={() => {
                    setCameraError(null);
                  }}
                  className="flex-1 py-1.5 border border-border-machina text-text-secondary hover:text-white uppercase font-bold text-[9px] cursor-pointer text-center bg-zinc-900 rounded-[1.5px]"
                >
                  Dismiss & Use Drone Sim
                </button>
                <button
                  onClick={() => {
                    const devUrl = window.location.href;
                    window.open(devUrl, "_blank");
                  }}
                  className="flex-1 py-1.5 bg-red-950 text-red-400 border border-red-900 hover:bg-red-900 hover:text-white uppercase font-bold text-[9px] cursor-pointer text-center rounded-[1.5px]"
                >
                  Open in New Tab
                </button>
              </div>
            </div>
          )}

          {/* Webcam stream rendering */}
          {usePhysicalCamera ? (
            <>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="absolute inset-0 w-full h-full object-cover opacity-15 z-0 pointer-events-none"
              />
              <canvas 
                ref={cvCanvasRef} 
                className="absolute inset-0 w-full h-full object-cover opacity-85 z-0 animate-fade-in"
                width={320}
                height={240}
              />
            </>
          ) : (
            <div className="absolute inset-0 opacity-10 pointer-events-none z-0 bg-[linear-gradient(rgba(196,164,132,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(196,164,132,0.1)_1px,transparent_1px)] bg-[size:16px_16px]"></div>
          )}

          {/* Augmented Real-time Bounding Boxes Overlays */}
          <div className="absolute inset-0 pointer-events-none z-10 font-mono text-[8px] p-6 select-none">
            {/* HELMET ZONE */}
            <div className={`absolute left-[38%] top-[12%] w-[24%] h-[15%] border-2 transition-all duration-300 flex flex-col justify-between p-1 text-[9px] bg-black/50 ${
              workerHardhat ? "border-emerald-500 text-emerald-400" : "border-red-600 text-red-500 animate-pulse bg-red-950/20"
            }`}>
              <span className="font-bold tracking-tight uppercase">
                {usePhysicalCamera && autoSyncCv ? `[HET: ${cvStatus.helmetConf}%]` : ""} {workerHardhat ? "✔ HEAD: SAFE" : "✖ NEED HELMET"}
              </span>
              <span className="text-right text-[7.5px] font-bold opacity-75">{workerHardhat ? "GRID LEVEL A" : "BREACH REGISTERED"}</span>
            </div>

            {/* EYE ZONE */}
            <div className={`absolute left-[41%] top-[29%] w-[18%] h-[10%] border transition-all duration-300 flex flex-col justify-between p-1 text-[9px] bg-black/50 ${
              workerShield ? "border-emerald-500/80 text-emerald-400" : "border-red-500/80 text-red-500 animate-pulse bg-red-950/15"
            }`}>
              <span className="font-extrabold uppercase">{workerShield ? "✔ EYE_WEAR: SAFE" : "✖ EYE_WEAR: MISSING"}</span>
            </div>

            {/* TORSO SUIT SECTION */}
            <div className={`absolute left-[26%] top-[42%] w-[48%] h-[32%] border-2 transition-all duration-300 flex flex-col justify-between p-2 text-[9px] bg-black/50 ${
              workerSuit ? "border-emerald-500 text-emerald-400" : "border-red-600 text-red-500 animate-pulse bg-red-950/20"
            }`}>
              <div className="flex justify-between font-bold uppercase">
                <span>{usePhysicalCamera && autoSyncCv ? `[SUT: ${cvStatus.suitConf}%]` : ""} {workerSuit ? "✔ TORSO: THERMAL SUIT" : "✖ COUPLING MISSING"}</span>
                <span>{workerSuit ? "SHIELD INTACT" : "DANGER EXPOSURE"}</span>
              </div>
              <div className="text-[7.5px] opacity-75">
                Ar PPM IMMUNITY: {workerSuit ? "100.0% COUPLING" : "0.0% SUSCEPTIBLE"}
              </div>
            </div>

            {/* GLOVES */}
            <div className={`absolute left-[10%] top-[56%] w-[14%] h-[18%] border transition-all duration-300 flex flex-col justify-between p-1.5 text-[9px] bg-black/40 ${
              workerGloves ? "border-emerald-500 text-emerald-400" : "border-red-600 text-red-500 animate-pulse bg-red-950/20"
            }`}>
              <span className="font-bold uppercase">L_GLOVE</span>
              <span className="text-[7.5px]">
                {usePhysicalCamera && autoSyncCv ? `${cvStatus.glovesConf}%` : (workerGloves ? "SECURE" : "MISSING")}
              </span>
            </div>

            <div className={`absolute right-[10%] top-[56%] w-[14%] h-[18%] border transition-all duration-300 flex flex-col justify-between p-1.5 text-[9px] bg-black/40 ${
              workerGloves ? "border-emerald-500 text-emerald-400" : "border-red-600 text-red-500 animate-pulse bg-red-950/20"
            }`}>
              <span className="font-bold uppercase">R_GLOVE</span>
              <span className="text-[7.5px]">
                {usePhysicalCamera && autoSyncCv ? `${cvStatus.glovesConf}%` : (workerGloves ? "SECURE" : "MISSING")}
              </span>
            </div>

            {/* BOOTS */}
            <div className={`absolute left-[34%] bottom-[5%] w-[32%] h-[13%] border-2 transition-all duration-300 flex flex-col justify-between p-1.5 text-[9px] bg-black/40 ${
              workerBoots ? "border-emerald-500 text-emerald-400" : "border-red-600 text-red-500 animate-pulse bg-red-950/20"
            }`}>
              <span className="font-bold uppercase">
                {usePhysicalCamera && autoSyncCv ? `[BTC: ${cvStatus.bootsConf}%]` : ""} {workerBoots ? "✔ TRACK: GRIP SAFE" : "✖ TRAC_ERROR_ALERT"}
              </span>
            </div>
          </div>

          {/* Sweeper animations */}
          {isScanning && (
            <div className="absolute inset-0 bg-red-950/25 pointer-events-none z-20">
              <div className="w-full h-1.5 bg-red-500 shadow-[0_0_20px_#ef4444] scanner-laser-line relative top-1/2"></div>
            </div>
          )}

          {/* Crosshairs */}
          <div className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-accent-machina z-20"></div>
          <div className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-accent-machina z-20"></div>
          <div className="absolute bottom-4 left-4 w-5 h-5 border-b-2 border-l-2 border-accent-machina z-20"></div>
          <div className="absolute bottom-4 right-4 w-5 h-5 border-b-2 border-r-2 border-accent-machina z-20"></div>

          {/* Top telemetry banner */}
          <div className="flex justify-between items-center font-mono text-[9px] text-text-secondary font-black tracking-wider uppercase z-20 select-none bg-black/60 px-3 py-1 border border-border-machina">
            <span className="text-accent-machina flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              RADAR_FEED_Z1: ACTIVE_STREAM_PRO
            </span>
            <span>SYS_TYPE: OPTICAL_SIGHT_V3</span>
          </div>

          {/* Central state HUD */}
          <div className="my-auto py-8 flex flex-col items-center justify-center space-y-4 z-20 relative select-none">
            {scanResult === "success" ? (
              <div className="text-center space-y-3 bg-[#0c0c0be6] border-2 border-emerald-500 p-6 rounded-[2px] shadow-2xl max-w-lg animate-fade-in">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/50">
                  <span className="text-3xl">👍</span>
                </div>
                <div className="font-mono space-y-1">
                  <span className="text-emerald-400 text-xs font-black tracking-widest block uppercase">// CHECK-IN COMPLIANT ✔</span>
                  <p className="text-[14px] text-text-primary px-3 py-2 font-black bg-zinc-950 border border-emerald-900 rounded-[1px] leading-snug">
                    "{shownQuote}"
                  </p>
                  <span className="text-[8.5px] text-zinc-500 block tracking-wider mt-1">// SHIFT GRANTED. COBALT ACCREDITATION CLEAR.</span>
                </div>
              </div>
            ) : scanResult === "failure" ? (
              <div className="text-center space-y-3 bg-[#0e0a0ae6] border-2 border-danger-machina p-6 rounded-[2px] shadow-2xl max-w-lg animate-fade-in">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-950 border border-red-700">
                  <ShieldAlert size={28} className="text-danger-machina animate-pulse" />
                </div>
                <div className="font-mono space-y-1.5">
                  <span className="text-danger-machina text-xs font-black tracking-widest block uppercase">CRITICAL SYSTEM BREACH</span>
                  <p className="text-[11px] text-danger-machina leading-relaxed font-bold bg-zinc-950 border border-red-900 py-2 px-3 uppercase">
                    ENTRY REJECTED: COUPLING DEFICIT - [{missingItemsList.join(", ").toUpperCase()}]
                  </p>
                  <span className="text-[8.5px] text-zinc-500 block uppercase tracking-wide">// ENGAGE ALL SAFETIES AT CONSOLE TO DISABLE LOCKOUT CHUTES</span>
                </div>
              </div>
            ) : isScanning ? (
              <div className="text-center space-y-2.5 font-mono bg-black/85 border border-border-machina/60 p-5 rounded-[1px] w-72">
                <Fingerprint size={44} className="text-red-500 animate-pulse mx-auto" />
                <span className="text-[9.5px] text-text-primary font-black tracking-widest block animate-pulse uppercase">
                  {scanStep}
                </span>
                <div className="w-56 h-1.5 bg-zinc-950 border border-border-machina/50 mx-auto relative overflow-hidden rounded-none">
                  <div className="h-full bg-red-600 animate-[pulse_1s_infinite] w-2/3"></div>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-2 p-5 rounded-[1.5px] border border-border-machina/40 bg-[#0c0c0b99] max-w-md">
                <div className="w-12 h-12 rounded-full border border-dotted border-border-machina flex items-center justify-center mx-auto text-text-secondary bg-black/60 mb-2">
                  <User size={24} />
                </div>
                <span className="text-[11px] text-text-primary tracking-wider block font-black animate-pulse">
                  LASER DETECTOR STANDBY: {videoFeedWorkerName.toUpperCase()}
                </span>
                <span className="text-[8px] text-zinc-500 block uppercase leading-relaxed">
                  PROVISION CORE APPAREL (HELMET, THERMAL SUIT & GLOVES) AND LAUNCH RADAR SYSTEM TO SECURE ACCREDITED ACCESS.
                </span>
              </div>
            )}
          </div>

          {/* Quick HUD indicator bar */}
          <div className="grid grid-cols-5 gap-3 font-mono text-[9px] text-center border-t border-border-machina/40 pt-4 select-none z-20 bg-[#0f0f0d99] backdrop-blur-[1px]">
            <div className={`p-2 border rounded-[1px] flex flex-col items-center gap-1.5 ${workerHardhat ? "border-emerald-500/60 text-emerald-400 bg-emerald-950/10" : "border-red-950 text-red-500 bg-red-950/10"}`}>
              <Shield size={14} />
              <span>HELMET</span>
            </div>
            <div className={`p-2 border rounded-[1px] flex flex-col items-center gap-1.5 ${workerShield ? "border-emerald-500/60 text-emerald-400 bg-emerald-950/10" : "border-red-950 text-red-500 bg-red-950/10"}`}>
              <Eye size={14} />
              <span>SHIELD</span>
            </div>
            <div className={`p-2 border rounded-[1px] flex flex-col items-center gap-1.5 ${workerSuit ? "border-emerald-500/60 text-emerald-400 bg-emerald-950/10" : "border-red-950 text-red-500 bg-red-950/10"}`}>
              <Sparkles size={14} />
              <span>SUIT</span>
            </div>
            <div className={`p-2 border rounded-[1px] flex flex-col items-center gap-1.5 ${workerGloves ? "border-emerald-500/60 text-emerald-400 bg-emerald-950/10" : "border-red-950 text-red-500 bg-red-950/10"}`}>
              <Fingerprint size={14} />
              <span>GLOVES</span>
            </div>
            <div className={`p-2 border rounded-[1px] flex flex-col items-center gap-1.5 ${workerBoots ? "border-emerald-500/60 text-emerald-400 bg-emerald-950/10" : "border-red-950 text-red-500 bg-red-950/10"}`}>
              <Footprints size={14} />
              <span>BOOTS</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: REFINED COMMAND SIDEBAR CONSOLE */}
        <div className="w-full md:w-[360px] shrink-0 bg-[#0A0A09] p-6 flex flex-col justify-between border-t md:border-t-0 md:border-l border-border-machina h-full overflow-y-auto space-y-6">
          
          <div className="space-y-6">
            {/* Header branding */}
            <div className="border-b border-border-machina pb-4 space-y-1">
              <span className="text-[8.5px] text-accent-machina font-bold tracking-[0.2em] block">// HARDWARE INSPECTION RADAR</span>
              <h2 className="text-xs font-black text-white tracking-[0.15em] uppercase">REAL-TIME LASER DETECTOR SYSTEM</h2>
              <p className="text-[8px] text-zinc-500 uppercase">OPERATIVE PROFILE: {videoFeedWorkerName}</p>
            </div>

            {/* Simulated hardware controls gear */}
            <div className="space-y-3">
              <span className="text-[9px] text-accent-machina font-black uppercase tracking-wider block">// TARGET APPAREL SIGNALS</span>
              <div className="space-y-2.5">
                <label className="flex items-center gap-2.5 cursor-pointer text-text-primary select-none p-2.5 bg-zinc-950 border border-border-machina hover:border-accent-machina transition-colors rounded-[1px]">
                  <input
                    type="checkbox"
                    checked={workerHardhat}
                    disabled={usePhysicalCamera && autoSyncCv}
                    onChange={(e) => setWorkerHardhat(e.target.checked)}
                    className="accent-accent-machina w-3.5 h-3.5 cursor-pointer disabled:opacity-40"
                  />
                  <div className="flex flex-col">
                    <span className="text-[9.5px] font-bold">SAFETY HELMET</span>
                    {usePhysicalCamera && autoSyncCv && <span className="text-[6.5px] text-accent-machina tracking-widest font-black uppercase mt-0.5">// OpenCV RETRIEVED</span>}
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-text-primary select-none p-2.5 bg-zinc-950 border border-border-machina hover:border-accent-machina transition-colors rounded-[1px]">
                  <input
                    type="checkbox"
                    checked={workerShield}
                    disabled={usePhysicalCamera && autoSyncCv}
                    onChange={(e) => setWorkerShield(e.target.checked)}
                    className="accent-accent-machina w-3.5 h-3.5 cursor-pointer disabled:opacity-40"
                  />
                  <div className="flex flex-col">
                    <span className="text-[9.5px] font-bold">EYE PROTECTION / SHIELD</span>
                    {usePhysicalCamera && autoSyncCv && <span className="text-[6.5px] text-accent-machina tracking-widest font-black uppercase mt-0.5">// OpenCV RETRIEVED</span>}
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-text-primary select-none p-2.5 bg-zinc-950 border border-border-machina hover:border-accent-machina transition-colors rounded-[1px]">
                  <input
                    type="checkbox"
                    checked={workerSuit}
                    disabled={usePhysicalCamera && autoSyncCv}
                    onChange={(e) => setWorkerSuit(e.target.checked)}
                    className="accent-accent-machina w-3.5 h-3.5 cursor-pointer disabled:opacity-40"
                  />
                  <div className="flex flex-col">
                    <span className="text-[9.5px] font-bold">AEROSPACE THERMAL SUIT</span>
                    {usePhysicalCamera && autoSyncCv && <span className="text-[6.5px] text-accent-machina tracking-widest font-black uppercase mt-0.5">// OpenCV RETRIEVED</span>}
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-text-primary select-none p-2.5 bg-zinc-950 border border-border-machina hover:border-accent-machina transition-colors rounded-[1px]">
                  <input
                    type="checkbox"
                    checked={workerGloves}
                    disabled={usePhysicalCamera && autoSyncCv}
                    onChange={(e) => setWorkerGloves(e.target.checked)}
                    className="accent-accent-machina w-3.5 h-3.5 cursor-pointer disabled:opacity-40"
                  />
                  <div className="flex flex-col">
                    <span className="text-[9.5px] font-bold">SILICON GROUND GLOVES</span>
                    {usePhysicalCamera && autoSyncCv && <span className="text-[6.5px] text-accent-machina tracking-widest font-black uppercase mt-0.5">// OpenCV RETRIEVED</span>}
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-text-primary select-none p-2.5 bg-zinc-950 border border-border-machina hover:border-accent-machina transition-colors rounded-[1px]">
                  <input
                    type="checkbox"
                    checked={workerBoots}
                    disabled={usePhysicalCamera && autoSyncCv}
                    onChange={(e) => setWorkerBoots(e.target.checked)}
                    className="accent-accent-machina w-3.5 h-3.5 cursor-pointer disabled:opacity-40"
                  />
                  <div className="flex flex-col">
                    <span className="text-[9.5px] font-bold">TRACTION STATIC-GROUND BOOTS</span>
                    {usePhysicalCamera && autoSyncCv && <span className="text-[6.5px] text-accent-machina tracking-widest font-black uppercase mt-0.5">// OpenCV RETRIEVED</span>}
                  </div>
                </label>
              </div>
            </div>

            {/* OpenCV Computer Vision Settings Bar (if physical camera enabled) */}
            {usePhysicalCamera && (
              <div className="space-y-2.5 bg-zinc-950 border border-border-machina p-3 rounded-[1px]">
                <div className="flex justify-between items-center text-[7.5px] text-zinc-500 uppercase font-black tracking-widest">
                  <span>// OpenCV ANALYZER DECK</span>
                  <span className="text-emerald-400">ACTIVE</span>
                </div>
                
                <div className="space-y-1.5">
                  <span className="text-[7.5px] text-zinc-500 uppercase font-black tracking-wider block">FILTER LEVEL</span>
                  <select
                    value={cvMode}
                    onChange={(e) => setCvMode(e.target.value as any)}
                    className="w-full bg-bg-machina border border-border-machina text-text-primary px-2 py-1 text-[9px] font-bold focus:outline-none focus:border-accent-machina uppercase cursor-pointer"
                  >
                    <option value="edges">Sobel Edge Gradient Kernel</option>
                    <option value="color-range">HSV Color Space Isolation</option>
                    <option value="raw">Raw Lens Bypass</option>
                  </select>
                </div>

                <label className="flex items-start gap-1.5 cursor-pointer text-text-primary select-none mt-1 p-1.5 bg-zinc-900 border border-border-machina rounded-[1px]">
                  <input
                    type="checkbox"
                    checked={autoSyncCv}
                    onChange={(e) => setAutoSyncCv(e.target.checked)}
                    className="accent-accent-machina w-3 h-3 cursor-pointer mt-0.5"
                  />
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black uppercase text-accent-machina leading-tight">AUTO OPTICAL OVERRIDE</span>
                    <span className="text-[6.5px] text-zinc-500 mt-0.5 leading-none">Conf level pixel matching is operational.</span>
                  </div>
                </label>
              </div>
            )}

            {/* Master emission big trigger button */}
            <div className="space-y-2">
              <button
                onClick={startRealtimeOpticalScan}
                disabled={isScanning}
                className={`w-full py-3 bg-accent-machina text-bg-machina text-[10px] uppercase font-black tracking-widest cursor-pointer hover:bg-white select-none transition-all rounded-[1px] flex items-center justify-center gap-1.5 ${
                  isScanning ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Fingerprint size={14} className={isScanning ? "animate-pulse" : ""} />
                <span>{isScanning ? "EMITTING INSPECTOR BEAM..." : "TRIGGER RADAR INSPECTION"}</span>
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-border-machina">
            {/* Direct Webcam hardware connector toggles */}
            <button
              onClick={toggleWebcam}
              className="w-full py-2 bg-zinc-950 hover:bg-white hover:text-bg-machina text-[9px] font-bold uppercase tracking-wider border border-border-machina/80 select-none transition-all cursor-pointer rounded-[1px] flex items-center justify-center gap-1.5"
            >
              {usePhysicalCamera ? <VideoOff size={11} /> : <Video size={11} />}
              <span>{usePhysicalCamera ? "DRONE WIREFRAME SIM" : "CONNECT LAPTOP WEB-CAM"}</span>
            </button>

            {/* Large close/minimize button */}
            <button
              onClick={() => setIsFullscreen(false)}
              className="w-full py-2.5 bg-red-950/30 hover:bg-danger-machina hover:text-bg-machina border border-danger-machina/50 text-danger-machina text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 cursor-pointer transition-all rounded-[1px] animate-pulse"
            >
              <Minimize2 size={12} />
              <span>EXIT FULLSCREEN PORTAL</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="safety-view-container" className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Vision Feed simulation and triggers */}
        <div className="lg:col-span-2 space-y-6">
          <IndustrialWidget
            title="REAL-TIME LASER OPTICAL DETECTOR MACHINE"
            subtitle="Real-time scanning portal for Safety Helmet, Thermal Suit, Gloves & Boots"
            headerAction={
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-mono border px-2.5 py-1 flex items-center gap-1.5 font-bold select-none ${
                  isScanning ? "bg-red-950/50 text-red-400 border-red-700 animate-pulse" : "bg-[#0F0F0D] border-border-machina text-text-primary"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isScanning ? "bg-red-500 animate-ping" : "bg-accent-machina"}`}></span>
                  {isScanning ? "MACHINE BEAM EMITTING..." : "PORTAL SYSTEM ACTIVE"}
                </span>
                <button
                  id="btn-toggle-fullscreen"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="px-2.5 py-1 bg-border-machina/20 hover:bg-white hover:text-bg-machina border border-border-machina text-text-primary text-[9px] font-black uppercase flex items-center gap-1 cursor-pointer transition-all rounded-[1px]"
                  title="Toggle fullscreen laser scanner viewport"
                >
                  {isFullscreen ? <Minimize2 size={10} /> : <Maximize2 size={10} />}
                  <span>{isFullscreen ? "MINIMIZE" : "FULLSCREEN"}</span>
                </button>
              </div>
            }
          >
            {/* Simulated camera scanning screen with optional Live HTML5 feed and real-time bounding overlays */}
            <div className={`flex flex-col justify-between transition-all duration-300 relative rounded-[3px] overflow-hidden ${
              isFullscreen ? "fixed inset-0 z-[9999] w-screen h-screen bg-[#0C0C0B] p-8 md:p-12 border-4 border-accent-machina/60" : "bg-[#0f0f0d] border border-border-machina p-5 min-h-[360px]"
            }`}>
              
              {/* Hardware Connection Error Diagnostic Overlay */}
              {cameraError && (
                <div className="absolute inset-0 bg-[#0c0c0bfa] backdrop-blur-sm z-30 flex flex-col justify-between p-5 border-2 border-red-950/70 font-mono">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-red-500 font-extrabold uppercase text-[10px] border-b border-red-950/60 pb-1.5">
                      <ShieldAlert size={14} className="animate-pulse" />
                      <span>Hardware Access Exception</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-normal">
                      {cameraError}
                    </p>
                    <div className="bg-zinc-950 border border-red-950/30 p-2.5 rounded-[1px] space-y-1.5 text-[8.5px] text-zinc-500">
                      <span className="block font-bold text-zinc-400 uppercase">// TECHNICAL DIAGNOSTICS & FIX:</span>
                      <p className="leading-relaxed">
                        1. <strong className="text-accent-machina">Iframe Sandboxing</strong>: Standard web browsers strictly block hardware device requests (camera and microphone streams) inside secure iframes.
                      </p>
                      <p className="leading-relaxed">
                        2. <strong className="text-accent-machina">Solution</strong>: Click the <strong className="text-white">"Open in New Tab"</strong> button in the upper right-hand corner of the environment to grant direct hardware access.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2.5">
                    <button
                      onClick={() => {
                        setCameraError(null);
                      }}
                      className="flex-1 py-1.5 border border-border-machina text-text-secondary hover:text-white uppercase font-bold text-[9px] cursor-pointer text-center bg-zinc-900 rounded-[1.5px]"
                    >
                      Dismiss & Use Drone Sim
                    </button>
                    <button
                      onClick={() => {
                        const devUrl = window.location.href;
                        window.open(devUrl, "_blank");
                      }}
                      className="flex-1 py-1.5 bg-red-950 text-red-400 border border-red-900 hover:bg-red-900 hover:text-white uppercase font-bold text-[9px] cursor-pointer text-center rounded-[1.5px]"
                    >
                      Open in New Tab
                    </button>
                  </div>
                </div>
              )}

              {/* If Webcam stream is active, bind html5 live stream and computer vision canvas */}
              {usePhysicalCamera ? (
                <>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="absolute inset-0 w-full h-full object-cover opacity-15 z-0 pointer-events-none"
                  />
                  <canvas 
                    ref={cvCanvasRef} 
                    className="absolute inset-0 w-full h-full object-cover opacity-85 z-0 animate-fade-in"
                    width={320}
                    height={240}
                  />
                </>
              ) : (
                // Futuristic tech grid lines backdrop
                <div className="absolute inset-0 opacity-10 pointer-events-none z-0 bg-[linear-gradient(rgba(196,164,132,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(196,164,132,0.1)_1px,transparent_1px)] bg-[size:16px_16px]"></div>
              )}

              {/* Augmented Real-time Bounding Boxes Overlays (Changes state color based on checkboxes in real-time) */}
              <div className="absolute inset-0 pointer-events-none z-10 font-mono text-[8px] p-4 select-none">
                
                {/* HELMET SCANNER HEAD ZONE */}
                <div className={`absolute left-[38%] top-[12%] w-[24%] h-[15%] border-2 transition-all duration-300 flex flex-col justify-between p-1 bg-black/40 ${
                  workerHardhat ? "border-emerald-500 text-emerald-400" : "border-red-600 text-red-500 animate-pulse bg-red-950/20"
                }`}>
                  <span className="font-bold tracking-tight uppercase">
                    {usePhysicalCamera && autoSyncCv ? `[HET: ${cvStatus.helmetConf}%]` : ""} {workerHardhat ? "✔ HEAD: SAFE" : "✖ RETRIEVING HARDHAT"}
                  </span>
                  <span className="text-right text-[7px] font-bold opacity-75">{workerHardhat ? "GRID LEVEL A" : "BREACH REGISTERED"}</span>
                </div>

                {/* EYE SHIELD MODULE */}
                <div className={`absolute left-[41%] top-[29%] w-[18%] h-[10%] border transition-all duration-300 flex flex-col justify-between p-1 bg-black/45 ${
                  workerShield ? "border-emerald-500/80 text-emerald-400" : "border-red-500/80 text-red-500 animate-pulse bg-red-950/15"
                }`}>
                  <span className="font-extrabold uppercase">{workerShield ? "✔ EYE_WEAR: DETECTED" : "✖ EYE_WEAR: MISSING"}</span>
                </div>

                {/* SUIT MID SECTION */}
                <div className={`absolute left-[28%] top-[42%] w-[44%] h-[32%] border-2 transition-all duration-300 flex flex-col justify-between p-1 bg-black/40 ${
                  workerSuit ? "border-emerald-500 text-emerald-400" : "border-red-600 text-red-500 animate-pulse bg-red-950/20"
                }`}>
                  <div className="flex justify-between font-bold uppercase">
                    <span>{usePhysicalCamera && autoSyncCv ? `[SUT: ${cvStatus.suitConf}%]` : ""} {workerSuit ? "✔ TORSO: SAFE ARMOUR" : "✖ COUPLING MISSING"}</span>
                    <span>{workerSuit ? "SHIELD ACTIVE" : "DANGER EXPOSURE"}</span>
                  </div>
                  <div className="text-[6.5px] opacity-75 leading-none">
                    Ar PPM IMMUNITY: {workerSuit ? "100.0% COUPLING" : "0.0% SUSCEPTIBLE"}
                  </div>
                </div>

                {/* GLOVES BOUNDING LEFT & RIGHT */}
                <div className={`absolute left-[12%] top-[56%] w-[13%] h-[18%] border transition-all duration-300 flex flex-col justify-between p-1 bg-black/30 ${
                  workerGloves ? "border-emerald-500 text-emerald-400" : "border-red-600 text-red-500 animate-pulse bg-red-950/20"
                }`}>
                  <span className="font-bold uppercase">L_GLOVE</span>
                  <span className="text-[7px]">
                    {usePhysicalCamera && autoSyncCv ? `${cvStatus.glovesConf}%` : (workerGloves ? "SECURE" : "MISSING")}
                  </span>
                </div>

                <div className={`absolute right-[12%] top-[56%] w-[13%] h-[18%] border transition-all duration-300 flex flex-col justify-between p-1 bg-black/30 ${
                  workerGloves ? "border-emerald-500 text-emerald-400" : "border-red-600 text-red-500 animate-pulse bg-red-950/20"
                }`}>
                  <span className="font-bold uppercase">R_GLOVE</span>
                  <span className="text-[7px]">
                    {usePhysicalCamera && autoSyncCv ? `${cvStatus.glovesConf}%` : (workerGloves ? "SECURE" : "MISSING")}
                  </span>
                </div>

                {/* VEHICLE STATIC TRACTION BOOTS */}
                <div className={`absolute left-[35%] bottom-[5%] w-[30%] h-[12%] border-2 transition-all duration-300 flex flex-col justify-between p-1 bg-black/30 ${
                  workerBoots ? "border-emerald-500 text-emerald-400" : "border-red-600 text-red-500 animate-pulse bg-red-950/20"
                }`}>
                  <span className="font-bold uppercase">
                    {usePhysicalCamera && autoSyncCv ? `[BTC: ${cvStatus.bootsConf}%]` : ""} {workerBoots ? "✔ TRACK: GRIP ON" : "✖ TRAC_ERROR"}
                  </span>
                </div>
              </div>

              {/* Animated laser line sweeper when scanning */}
              {isScanning && (
                <div className="absolute inset-0 bg-red-950/20 pointer-events-none z-20">
                  <div className="w-full h-1 bg-red-500 shadow-[0_0_15px_#ef4444] scanner-laser-line relative top-1/2"></div>
                </div>
              )}

              {/* Angle brackets/crosshairs */}
              <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-border-machina z-20"></div>
              <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-border-machina z-20"></div>
              <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-border-machina z-20"></div>
              <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-border-machina z-20"></div>

              {/* Scanning status banner */}
              <div className="flex justify-between items-center font-mono text-[9px] text-text-secondary font-black tracking-wider uppercase z-20 select-none bg-black/40 px-2 py-0.5 border border-border-machina/40">
                <span>PORT_ID: OPTICAL_CHAMBER_Z1</span>
                <span className="flex items-center gap-1.5">
                  <button 
                    onClick={toggleWebcam} 
                    className="text-accent-machina underline cursor-pointer hover:text-white flex items-center gap-1 text-[8px]"
                  >
                    {usePhysicalCamera ? <VideoOff size={10} /> : <Video size={10} />}
                    {usePhysicalCamera ? "DRONE SIM FEED" : "CONNECT LIVE LAPTOP WEB-CAM"}
                  </button>
                  <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="text-accent-machina underline cursor-pointer hover:text-white flex items-center gap-1 text-[8px] border-l border-zinc-700/60 pl-1.5 ml-1"
                  >
                    {isFullscreen ? <Minimize2 size={10} /> : <Maximize2 size={10} />}
                    <span>{isFullscreen ? "EXIT FULLSCREEN" : "FULLSCREEN RADAR"}</span>
                  </button>
                </span>
                <span>SYS_TYPE: MACHINE_SIGHT_PRO</span>
              </div>

              {/* Central scanning HUD state */}
              <div className="my-4 py-8 flex flex-col items-center justify-center space-y-4 z-20 relative select-none">
                
                {scanResult === "success" ? (
                  /* Giga check positive outcome with thumb emoji and quote! */
                  <div className="text-center space-y-3 bg-[#0c0c0be6] border-2 border-emerald-500 p-5 rounded-[2px] shadow-2xl max-w-md animate-fade-in">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/50">
                      <span className="text-3xl select-none">👍</span>
                    </div>
                    <div className="font-mono space-y-1">
                      <span className="text-emerald-400 text-xs font-black tracking-widest block uppercase">// CHECK-IN COMPLIANT ✔</span>
                      <p className="text-[14px] text-text-primary px-3 py-1 font-black bg-zinc-950 border border-emerald-900 rounded-[1px] leading-snug">
                        "{shownQuote}"
                      </p>
                      <span className="text-[8px] text-zinc-500 block tracking-wider mt-1">// SHIFT GRANTED. SAFETY GATEWAY AUTHORIZED.</span>
                    </div>
                  </div>
                ) : scanResult === "failure" ? (
                  /* Red danger warning indicator for fail scans */
                  <div className="text-center space-y-3 bg-[#0e0a0ae6] border-2 border-danger-machina p-5 rounded-[2px] shadow-2xl max-w-md animate-fade-in">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-950 border border-red-700">
                      <ShieldAlert size={28} className="text-danger-machina animate-pulse" />
                    </div>
                    <div className="font-mono space-y-1.5">
                      <span className="text-danger-machina text-xs font-black tracking-widest block uppercase">CRITICAL SYSTEM BREACH</span>
                      <p className="text-[10px] text-danger-machina leading-relaxed font-bold bg-zinc-950 border border-red-900 py-2 px-3 uppercase">
                        ENTRY REJECTED: COUPLING DEFICIT - [{missingItemsList.join(", ").toUpperCase()}]
                      </p>
                      <span className="text-[8px] text-zinc-500 block uppercase tracking-wide">// ENGAGE ALL SAFETIES BELOW TO DISABLE LOCKOUT CHUTES</span>
                    </div>
                  </div>
                ) : isScanning ? (
                  /* Scanning state progress indicator */
                  <div className="text-center space-y-2 font-mono bg-black/75 border border-border-machina/60 p-4 rounded-[1px] w-64">
                    <Fingerprint size={40} className="text-red-500 animate-pulse mx-auto" />
                    <span className="text-[9px] text-text-primary font-black tracking-widest block animate-pulse uppercase">
                      {scanStep}
                    </span>
                    <div className="w-48 h-1.5 bg-zinc-950 border border-border-machina/50 mx-auto relative overflow-hidden rounded-none">
                      <div className="h-full bg-red-600 animate-[pulse_1s_infinite] w-2/3"></div>
                    </div>
                  </div>
                ) : (
                  /* Steady state: ready scanner view */
                  <div className="text-center space-y-2 font-mono bg-[#0c0c0b99] border border-border-machina/40 p-4 rounded-[1.5px] max-w-md">
                    <div className="w-10 h-10 rounded-full border border-dotted border-border-machina flex items-center justify-center mx-auto text-text-secondary bg-black/60">
                      <User size={20} />
                    </div>
                    <span className="text-[10px] text-text-primary tracking-wider block font-bold">
                      CAMERA READY FOR OPERATIVE: {videoFeedWorkerName.toUpperCase()}
                    </span>
                    <span className="text-[8px] text-zinc-500 block uppercase">
                      WEAR YOUR HARDWARE HELMET, THERMAL SUIT & GLOVES AND INITIALIZE SCANNER BEAM.
                    </span>
                  </div>
                )}
              </div>

              {/* Horizontal layout indicators of item components */}
              <div className="grid grid-cols-5 gap-2 font-mono text-[9px] text-center border-t border-border-machina/60 pt-3 select-none z-20 bg-[#0f0f0d99] backdrop-blur-[1px]">
                <div className={`p-1.5 border rounded-[1px] flex flex-col items-center gap-1 ${workerHardhat ? "border-emerald-500/60 text-emerald-400 bg-emerald-950/10" : "border-red-950 text-red-500 bg-red-950/10"}`}>
                  <Shield size={12} />
                  <span>HELMET</span>
                </div>
                <div className={`p-1.5 border rounded-[1px] flex flex-col items-center gap-1 ${workerShield ? "border-emerald-500/60 text-emerald-400 bg-emerald-950/10" : "border-red-950 text-red-500 bg-red-950/10"}`}>
                  <Eye size={12} />
                  <span>SHIELD</span>
                </div>
                <div className={`p-1.5 border rounded-[1px] flex flex-col items-center gap-1 ${workerSuit ? "border-emerald-500/60 text-emerald-400 bg-emerald-950/10" : "border-red-950 text-red-500 bg-red-950/10"}`}>
                  <Sparkles size={12} />
                  <span>SUIT</span>
                </div>
                <div className={`p-1.5 border rounded-[1px] flex flex-col items-center gap-1 ${workerGloves ? "border-emerald-500/60 text-emerald-400 bg-emerald-950/10" : "border-red-950 text-red-500 bg-red-950/10"}`}>
                  <Fingerprint size={12} />
                  <span>GLOVES</span>
                </div>
                <div className={`p-1.5 border rounded-[1px] flex flex-col items-center gap-1 ${workerBoots ? "border-emerald-500/60 text-emerald-400 bg-emerald-950/10" : "border-red-950 text-red-500 bg-red-950/10"}`}>
                  <Footprints size={12} />
                  <span>BOOTS</span>
                </div>
              </div>
            </div>

            {/* OpenCV REAL-TIME MATRIX CONTROLLER DESK */}
            {usePhysicalCamera && (
              <div className="bg-[#0f0f0d] border border-border-machina p-4 font-mono text-[10px] space-y-3 rounded-[2.5px] mt-4 animate-fade-in">
                <div className="flex justify-between items-center border-b border-border-machina/60 pb-1.5">
                  <span className="text-accent-machina font-black uppercase tracking-wider block">// SYSTEM OpenCV MASK CALIBRATOR</span>
                  <span className="bg-emerald-950 text-emerald-400 px-1.5 py-0.2 rounded-[1.5px] font-black uppercase text-[8px] border border-emerald-900 leading-none">
                    ENGINE_ACTIVE
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2.5">
                    <div>
                      <span className="block text-[8.5px] text-zinc-500 uppercase font-black tracking-wider mb-1">
                        OpenCV FILTER ENGINE MODE
                      </span>
                      <select
                        value={cvMode}
                        onChange={(e) => setCvMode(e.target.value as any)}
                        className="w-full bg-bg-machina border border-border-machina text-text-primary px-2.5 py-1.5 text-[9.5px] font-bold focus:outline-none focus:border-accent-machina rounded-[1px] uppercase cursor-pointer"
                      >
                        <option value="edges">Sobel Edge Gradient Kernel</option>
                        <option value="color-range">HSV Color Space Isolation</option>
                        <option value="raw">Raw Lens Bypass</option>
                      </select>
                    </div>

                    {cvMode === "color-range" && (
                      <div>
                        <span className="block text-[8.5px] text-zinc-500 uppercase font-black tracking-wider mb-1">
                          TARGET LENS TRACKING VALUE
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                          {["yellow", "blue", "red"].map((colorOption) => (
                            <button
                              key={colorOption}
                              onClick={() => setCvTrackColor(colorOption as any)}
                              className={`px-1.5 py-1 text-[8px] font-black rounded-[1px] uppercase border transition-all cursor-pointer ${
                                cvTrackColor === colorOption 
                                  ? "bg-accent-machina text-bg-machina border-accent-machina font-black" 
                                  : "bg-bg-machina text-text-secondary border-border-machina hover:border-zinc-500"
                              }`}
                            >
                              {colorOption === "yellow" ? "YELLOW [HELMET]" : colorOption === "blue" ? "BLUE [SUIT]" : "RED [GLOVES]"}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <label className="flex items-start gap-2 cursor-pointer text-text-primary select-none p-2 bg-zinc-950 border border-border-machina/60 hover:border-accent-machina rounded-[1px]">
                      <input
                        type="checkbox"
                        checked={autoSyncCv}
                        onChange={(e) => setAutoSyncCv(e.target.checked)}
                        className="accent-accent-machina bg-bg-machina w-3.5 h-3.5 cursor-pointer mt-0.5"
                      />
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase text-accent-machina leading-tight">AUTOMATIC OPTICAL COMPLIANCE LOCK</span>
                        <span className="text-[7.5px] text-zinc-500 leading-normal mt-0.5">Let pixel-matrix confidence levels override and check all safeties automatically.</span>
                      </div>
                    </label>
                  </div>

                  <div className="bg-zinc-950 border border-border-machina/50 p-2.5 rounded-[1px] flex flex-col justify-between font-mono">
                    <span className="text-[8px] text-zinc-400 font-extrabold block uppercase tracking-wider">// LENS STREAM METRIC CHANNELS</span>
                    
                    <div className="space-y-2 text-[8px] uppercase mt-2">
                      <div className="space-y-0.5">
                        <div className="flex justify-between items-center text-zinc-400">
                          <span>MOTION CHANGE VECTOR:</span>
                          <span className="text-text-primary font-bold">{cvStatus.motion}%</span>
                        </div>
                        <div className="w-full bg-bg-machina h-1 rounded-[1px] overflow-hidden">
                          <div className="bg-[#C4A484] h-full transition-all duration-150" style={{ width: `${cvStatus.motion}%` }}></div>
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex justify-between items-center text-zinc-400">
                          <span>HELMET DENSITY SIGMA (TARGET Yellow):</span>
                          <span className={`font-bold ${cvStatus.helmetConf > 22 ? "text-emerald-400" : "text-zinc-500"}`}>{cvStatus.helmetConf}%</span>
                        </div>
                        <div className="w-full bg-bg-machina h-1 rounded-[1px] overflow-hidden">
                          <div className={`h-full transition-all duration-300 ${cvStatus.helmetConf > 22 ? "bg-emerald-500" : "bg-zinc-700"}`} style={{ width: `${cvStatus.helmetConf}%` }}></div>
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex justify-between items-center text-zinc-400">
                          <span>SUIT DENSITY SIGMA (TARGET Blue):</span>
                          <span className={`font-bold ${cvStatus.suitConf > 18 ? "text-emerald-400" : "text-zinc-500"}`}>{cvStatus.suitConf}%</span>
                        </div>
                        <div className="w-full bg-bg-machina h-1 rounded-[1px] overflow-hidden">
                          <div className={`h-full transition-all duration-300 ${cvStatus.suitConf > 18 ? "bg-emerald-500" : "bg-zinc-700"}`} style={{ width: `${cvStatus.suitConf}%` }}></div>
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex justify-between items-center text-zinc-400">
                          <span>GLOVES DENSITY SIGMA (TARGET Red):</span>
                          <span className={`font-bold ${cvStatus.glovesConf > 15 ? "text-emerald-400" : "text-zinc-500"}`}>{cvStatus.glovesConf}%</span>
                        </div>
                        <div className="w-full bg-bg-machina h-1 rounded-[1px] overflow-hidden">
                          <div className={`h-full transition-all duration-300 ${cvStatus.glovesConf > 15 ? "bg-emerald-500" : "bg-zinc-700"}`} style={{ width: `${cvStatus.glovesConf}%` }}></div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-t border-border-machina/40 pt-1.5 mt-2 text-[7.5px] text-zinc-500 uppercase">
                      <span>LENS FPS: {cvStatus.fps} FPS</span>
                      <span>HUE THRESHOLD: {cvStatus.hueTarget}°</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Gear state toggler switches (Simulating what they wear) */}
            <div className="bg-card-machina border border-border-machina p-4 space-y-4 font-mono text-xs rounded-[2px] mt-4">
              <span className="text-[9px] text-accent-machina font-black uppercase tracking-widest block">// CONTROL DECK: EQUIP GEAR MANUALLY FOR COMPLIANCE</span>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-text-primary select-none p-2 bg-bg-machina border border-border-machina hover:border-accent-machina rounded-[1.5px]">
                  <input
                    id="gear-hardhat"
                    type="checkbox"
                    checked={workerHardhat}
                    disabled={usePhysicalCamera && autoSyncCv}
                    onChange={(e) => setWorkerHardhat(e.target.checked)}
                    className="accent-accent-machina bg-bg-machina w-3.5 h-3.5 cursor-pointer disabled:opacity-40"
                  />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold">WEAR SAFETY HELMET</span>
                    {usePhysicalCamera && autoSyncCv && <span className="text-[7px] text-accent-machina font-bold uppercase tracking-wider animate-pulse">// OpenCV SYNCED</span>}
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-text-primary select-none p-2 bg-bg-machina border border-border-machina hover:border-accent-machina rounded-[1.5px]">
                  <input
                    id="gear-shield"
                    type="checkbox"
                    checked={workerShield}
                    disabled={usePhysicalCamera && autoSyncCv}
                    onChange={(e) => setWorkerShield(e.target.checked)}
                    className="accent-accent-machina bg-bg-machina w-3.5 h-3.5 cursor-pointer disabled:opacity-40"
                  />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold">WEAR EYE FACE-SHIELD</span>
                    {usePhysicalCamera && autoSyncCv && <span className="text-[7px] text-accent-machina font-bold uppercase tracking-wider animate-pulse">// OpenCV SYNCED</span>}
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-text-primary select-none p-2 bg-bg-machina border border-border-machina hover:border-accent-machina rounded-[1.5px]">
                  <input
                    id="gear-suit"
                    type="checkbox"
                    checked={workerSuit}
                    disabled={usePhysicalCamera && autoSyncCv}
                    onChange={(e) => setWorkerSuit(e.target.checked)}
                    className="accent-accent-machina bg-bg-machina w-3.5 h-3.5 cursor-pointer disabled:opacity-40"
                  />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold">WEAR THERMAL SUIT</span>
                    {usePhysicalCamera && autoSyncCv && <span className="text-[7px] text-accent-machina font-bold uppercase tracking-wider animate-pulse">// OpenCV SYNCED</span>}
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-text-primary select-none p-2 bg-bg-machina border border-border-machina hover:border-accent-machina rounded-[1.5px]">
                  <input
                    id="gear-gloves"
                    type="checkbox"
                    checked={workerGloves}
                    disabled={usePhysicalCamera && autoSyncCv}
                    onChange={(e) => setWorkerGloves(e.target.checked)}
                    className="accent-accent-machina bg-bg-machina w-3.5 h-3.5 cursor-pointer disabled:opacity-40"
                  />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold">WEAR INSULATED GLOVES</span>
                    {usePhysicalCamera && autoSyncCv && <span className="text-[7px] text-accent-machina font-bold uppercase tracking-wider animate-pulse">// OpenCV SYNCED</span>}
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-text-primary select-none p-2 bg-bg-machina border border-border-machina hover:border-accent-machina rounded-[1.5px]">
                  <input
                    id="gear-boots"
                    type="checkbox"
                    checked={workerBoots}
                    disabled={usePhysicalCamera && autoSyncCv}
                    onChange={(e) => setWorkerBoots(e.target.checked)}
                    className="accent-accent-machina bg-bg-machina w-3.5 h-3.5 cursor-pointer disabled:opacity-40"
                  />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold">WEAR STATIC-GROUND BOOTS</span>
                    {usePhysicalCamera && autoSyncCv && <span className="text-[7px] text-accent-machina font-bold uppercase tracking-wider animate-pulse">// OpenCV SYNCED</span>}
                  </div>
                </label>

                <button
                  id="btn-safety-portal-scan"
                  onClick={startRealtimeOpticalScan}
                  disabled={isScanning}
                  className={`w-full py-2 bg-accent-machina text-bg-machina text-[10px] uppercase font-black tracking-widest cursor-pointer hover:bg-white select-none transition-all rounded-[1px] ${
                    isScanning ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isScanning ? "SCANNING..." : "TRIGGER RADAR LASER SCAN"}
                </button>
              </div>
            </div>
          </IndustrialWidget>

          {/* Gas Environmental Readings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card-machina border border-border-machina p-5 relative rounded-[3px] font-mono">
              <span className="text-[10px] text-text-secondary uppercase block tracking-wider mb-2 font-bold">
                ARGON GAS CONTAINMENT RATIO (Ar)
              </span>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-2xl font-black text-text-primary">{gasReadingArgon.toFixed(1)} PPM</span>
                <span className="text-[9px] text-text-secondary uppercase">THRESHOLD LIMIT: {gasThreshold.toFixed(1)}</span>
              </div>
              <div className="w-full h-2 bg-bg-machina border border-border-machina overflow-hidden mt-2 p-[1px]">
                <div 
                  className={`h-full ${gasReadingArgon > gasThreshold ? "bg-danger-machina" : "bg-accent-machina"}`} 
                  style={{ width: `${Math.min(100, (gasReadingArgon / gasThreshold) * 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-card-machina border border-border-machina p-5 relative rounded-[3px] font-mono">
              <span className="text-[10px] text-text-secondary uppercase block tracking-wider mb-2 font-bold">
                ATMOSPHERIC CARBON MONOXIDE (CO)
              </span>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-2xl font-black text-text-primary">{gasReadingMonoxide.toFixed(1)} PPM</span>
                <span className="text-[9px] text-text-secondary uppercase">OSHA LIMIT: 15.0 PPM</span>
              </div>
              <div className="w-full h-2 bg-bg-machina border border-border-machina overflow-hidden mt-2 p-[1px]">
                <div 
                  className="h-full bg-accent-machina" 
                  style={{ width: `${(gasReadingMonoxide / 15.0) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Safety limits settings and Alarms list */}
        <div className="lg:col-span-1 space-y-6">
          {/* Module 1: OSHA Critical Threshold calibrators */}
          <IndustrialWidget
            title="OSHA CRITICAL THRESHOLD TRIGGER CONTROLLERS"
            subtitle="Live calibrated emergency sliders with trigger alarms"
          >
            <div className="space-y-4 font-mono text-[10px]">
              <div>
                <div className="flex justify-between items-center mb-1 bg-black/40 p-1.5 border border-border-machina/40">
                  <span className="text-zinc-400">ARGON GAS TRIGGER LIMIT (PPM):</span>
                  <span className="text-accent-machina font-black">{gasThreshold.toFixed(1)} PPM</span>
                </div>
                <input
                  type="range"
                  min="5.0"
                  max="15.0"
                  step="0.5"
                  value={gasThreshold}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setGasThreshold(val);
                    if (val < gasReadingArgon) {
                      alarmEngine.startSiren();
                      if (addIncident) {
                        addIncident({
                          id: `argon-auto-${Date.now()}`,
                          zone: "Cryogenic Vault Beta",
                          category: "Gas Leak",
                          message: `OSHA Argon Gas limit breach: Active level ${gasReadingArgon.toFixed(1)} PPM exceeded critical threshold setting of ${val.toFixed(1)} PPM.`,
                          level: "critical",
                          timestamp: new Date().toISOString(),
                          acknowledged: false
                        });
                      }
                    }
                  }}
                  className="w-full h-1.5 bg-bg-machina appearance-none cursor-pointer accent-accent-machina border border-border-machina rounded-[1px]"
                />
                <div className="flex justify-between mt-1 text-[8px] text-zinc-500">
                  <span>5.0 PPM</span>
                  <span>15.0 PPM</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1 bg-black/40 p-1.5 border border-border-machina/40">
                  <span className="text-zinc-400">BEARING MAX THERMAL THRESHOLD (°C):</span>
                  <span className="text-accent-machina font-black">{tempThreshold.toFixed(1)} °C</span>
                </div>
                <input
                  type="range"
                  min="60.0"
                  max="110.0"
                  step="1.0"
                  value={tempThreshold}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setTempThreshold(val);
                    const currentBearingTemp = 76.4;
                    if (val < currentBearingTemp) {
                      alarmEngine.startSiren();
                      if (addIncident) {
                        addIncident({
                          id: `temp-auto-${Date.now()}`,
                          zone: "Core Turbine Mezzanine",
                          category: "Thermal Spike",
                          message: `Critical high thermal threshold breached. Current turbine bearing temp ${currentBearingTemp.toFixed(1)}°C exceeded max limit ${val.toFixed(1)}°C.`,
                          level: "emergency",
                          timestamp: new Date().toISOString(),
                          acknowledged: false
                        });
                      }
                    }
                  }}
                  className="w-full h-1.5 bg-bg-machina appearance-none cursor-pointer accent-accent-machina border border-border-machina rounded-[1px]"
                />
                <div className="flex justify-between mt-1 text-[8px] text-zinc-500">
                  <span>60.0 °C</span>
                  <span>110.0 °C</span>
                </div>
              </div>

              <div className="p-2 border border-border-machina rounded-[1px] bg-[#0c0c0b] text-[8.5px] text-zinc-400 uppercase leading-relaxed">
                <span className="text-accent-machina font-black block mb-1">🔥 DYNAMIC COUPLING VERIFICATION:</span>
                Dragging trigger selectors below live values (Argon: {gasReadingArgon.toFixed(1)} PPM / Bearing: 76.4°C) automatically injects active reactive incident entries and activates plant alarms.
              </div>
            </div>
          </IndustrialWidget>

          {/* Module 2: ISO safety field auditor */}
          <IndustrialWidget
            title="ISO 9001 / 14001 PLANT FIELD AUDITOR"
            subtitle="Safety walkdown compliance scorecard ledger verification"
          >
            <div className="space-y-4 font-mono text-[10px]">
              <div className="flex justify-between items-center bg-black/40 border border-border-machina p-3 rounded-[1px]">
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-black text-text-primary tracking-wide">COMPLIANCE RATING</span>
                  <span className="text-[7.5px] text-zinc-500 uppercase">ISO Audit Scorecard Verification</span>
                </div>
                <div className={`text-2xl font-black ${walkdownScore === 100 ? "text-emerald-400" : walkdownScore >= 60 ? "text-amber-500 animate-pulse" : "text-danger-machina animate-pulse"}`}>
                  {walkdownScore}%
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="flex items-center gap-2.5 cursor-pointer text-text-primary select-none p-2 bg-bg-machina border border-border-machina/80 hover:border-accent-machina rounded-[1px] transition-colors">
                  <input
                    type="checkbox"
                    checked={walkdownCatwalks}
                    onChange={(e) => setWalkdownCatwalks(e.target.checked)}
                    className="accent-accent-machina bg-bg-machina w-3.5 h-3.5 cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className={`text-[9px] font-bold ${walkdownCatwalks ? "text-text-primary" : "text-zinc-500 line-through"}`}>CATWALKS & HANDRAILS SAFE</span>
                    <span className="text-[7px] text-zinc-500">Symmetrical safety rails secure with zero anomalies</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-text-primary select-none p-2 bg-bg-machina border border-border-machina/80 hover:border-accent-machina rounded-[1px] transition-colors">
                  <input
                    type="checkbox"
                    checked={walkdownGlassPaths}
                    onChange={(e) => setWalkdownGlassPaths(e.target.checked)}
                    className="accent-accent-machina bg-bg-machina w-3.5 h-3.5 cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className={`text-[9px] font-bold ${walkdownGlassPaths ? "text-text-primary" : "text-zinc-500 line-through"}`}>GLASS WALKWAYS DEBRIS-FREE</span>
                    <span className="text-[7px] text-zinc-500">Surface micro-scanner verifies path cleanliness</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-text-primary select-none p-2 bg-bg-machina border border-border-machina/80 hover:border-accent-machina rounded-[1px] transition-colors">
                  <input
                    type="checkbox"
                    checked={walkdownVoltageShields}
                    onChange={(e) => setWalkdownVoltageShields(e.target.checked)}
                    className="accent-accent-machina bg-bg-machina w-3.5 h-3.5 cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className={`text-[9px] font-bold ${walkdownVoltageShields ? "text-text-primary" : "text-zinc-500 line-through"}`}>13.8kV INDUCTION SHIELDS INSTALLED</span>
                    <span className="text-[7px] text-zinc-500">Magnetic induction flux grounds verified active</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-text-primary select-none p-2 bg-bg-machina border border-border-machina/80 hover:border-accent-machina rounded-[1px] transition-colors">
                  <input
                    type="checkbox"
                    checked={walkdownCryoConduits}
                    onChange={(e) => setWalkdownCryoConduits(e.target.checked)}
                    className="accent-accent-machina bg-bg-machina w-3.5 h-3.5 cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className={`text-[9px] font-bold ${walkdownCryoConduits ? "text-text-primary" : "text-zinc-500 line-through"}`}>CRYO-CONDUITS VALVE SEAL INTEGRITY</span>
                    <span className="text-[7px] text-zinc-500">No thermal bleeding detected on copper busways</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-text-primary select-none p-2 bg-bg-machina border border-border-machina/80 hover:border-accent-machina rounded-[1px] transition-colors">
                  <input
                    type="checkbox"
                    checked={walkdownSirens}
                    onChange={(e) => setWalkdownSirens(e.target.checked)}
                    className="accent-accent-machina bg-bg-machina w-3.5 h-3.5 cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className={`text-[9px] font-bold ${walkdownSirens ? "text-text-primary" : "text-zinc-500 line-through"}`}>EMERGENCY AUXILIARY SIRENS ONLINE</span>
                    <span className="text-[7px] text-zinc-500">Sound-level acoustic dB sweep passes calibration</span>
                  </div>
                </label>
              </div>

              <button
                id="btn-submit-iso-report"
                onClick={handleAuditReportSubmit}
                className="w-full py-2 bg-accent-machina hover:bg-white text-bg-machina font-black uppercase text-[10px] tracking-widest cursor-pointer hover:shadow-lg transition-all rounded-[1px]"
              >
                SUBMIT OFFICIAL COMPLIANCE LOGS
              </button>
            </div>
          </IndustrialWidget>

          <IndustrialWidget
            title="CAMERA SAFETY SCAN HISTORY"
            subtitle="Historical ledger of biometric & laser optical PPE check-ins"
          >
            <div className="bg-[#0F0F0D] border border-border-machina rounded-[2px] p-2 flex flex-col h-[280px]">
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
                {history
                  .filter((h) => h.category === "SAFETY_SCAN")
                  .map((h, idx) => {
                    const isPassed = h.title.includes("CLEARED") || h.title.includes("COMPLIANT") || h.description.includes("passed");
                    const statusText = isPassed ? "✔ COMPLIANT" : "✖ PPE DEFICIT";
                    const badgeColor = isPassed
                      ? "border-emerald-500/40 text-emerald-400 bg-emerald-950/20"
                      : "border-danger-machina/55 text-danger-machina bg-red-950/20";
                    const bannerAccent = isPassed ? "bg-emerald-500/40" : "bg-danger-machina/40";

                    return (
                      <div 
                        key={h.id || idx} 
                        className="bg-bg-machina border border-border-machina/80 p-2.5 rounded-[1.5px] relative flex flex-col gap-1 hover:bg-hover-machina transition-colors"
                      >
                        <div className={`absolute top-0 left-0 bottom-0 w-[2.5px] ${bannerAccent}`}></div>
                        
                        <div className="flex justify-between items-center pl-1 text-[8.5px] font-bold">
                          <span className="text-zinc-500">{h.timestamp.slice(0, 10)} @ {h.timestamp.slice(11, 16)}</span>
                          <span className={`px-1.5 py-0.2 border text-[7.5px] font-black uppercase tracking-wider rounded-[1px] ${badgeColor}`}>
                            {statusText}
                          </span>
                        </div>

                        <div className="pl-1 text-[9.5px]">
                          <span className="text-text-primary font-black uppercase block leading-tight">
                            {h.title}
                          </span>
                          <p className="text-[8.5px] text-text-secondary mt-1 tracking-tight leading-relaxed uppercase">
                            {h.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                {history.filter((h) => h.category === "SAFETY_SCAN").length === 0 && (
                  <div className="text-center py-12 text-text-secondary uppercase text-[9px] font-bold">
                    No safety camera scans logged in state memory yet.
                  </div>
                )}
              </div>
            </div>
          </IndustrialWidget>

          <IndustrialWidget
            title="OPTICAL VIOLATIONS LOG"
            subtitle="Recent camera compliance alerts"
          >
            <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
              {incidents.filter(x => x.category === "PPE Breach" || x.category === "Gas Leak").map((inc) => (
                <div
                  key={inc.id}
                  className={`p-3 border font-mono text-[10px] relative hover:-translate-y-0.5 transition-all duration-150 ${
                    inc.acknowledged 
                      ? "bg-bg-machina border-border-machina text-text-secondary" 
                      : "bg-card-machina border-danger-machina text-text-primary"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-extrabold text-[11px] text-danger-machina uppercase tracking-widest">{inc.category}</span>
                    <span className="text-text-secondary font-bold">{inc.timestamp.slice(11, 19)} Z</span>
                  </div>
                  <p className="leading-snug text-[11px] mb-2 font-bold">{inc.message.toUpperCase()}</p>
                  {!inc.acknowledged && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[8px] text-text-secondary tracking-wider uppercase">SQUELCH WITH NUT →</span>
                      <IronNutButton
                        onClick={() => acknowledgeIncident(inc.id)}
                        title="Press iron nut to ACK & SQUELCH"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </IndustrialWidget>
        </div>
      </div>
    </div>
  );
}
