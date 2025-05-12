"use client";

// components/GodotGame.tsx

declare global {
  interface Window {
    Engine?: any; // Godot Engine 클래스/생성자

    Godot?: any; // index.js 파일의 최상위 Godot 객체 (Emscripten 모듈 관련) // --- Godot <-> JS 통신을 위한 함수 선언 --- // Godot가 호출할 JS 함수 (JS -> Godot 방향 데이터 전달 시 Godot가 요청)

    getSongDataForGodot?: () => any; // Godot가 호출할 JS 함수 (Godot -> JS 방향 데이터 전달)

    handleGameResults?: (resultsJsonString: string) => void; // JS가 Godot 함수를 호출하는 방식 (필요시 Godot 스크립트에서 JS에 노출해야 함) // 예: startGameInGodot?: (songData: any) => void; // ----------------------------------------
  }
}

import React, { useRef, useEffect } from "react";

// Next.js의 dynamic import 시 ssr: false를 사용했으므로 window, document 객체에 안전하게 접근 가능

// import { useRouter } from 'next/router'; // 페이지 컴포넌트의 경우

const GodotGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const godotScriptState = useRef<"idle" | "loading" | "loaded" | "error">(
    "idle"
  );

  let godotEngine: any = null; // Godot Engine 인스턴스를 담을 변수

  const scriptSrc = "/game/index.js"; // 스크립트 경로를 전역 변수로 선언 // --- Next.js -> Godot: 곡 정보 전달 함수 (Godot가 호출하여 가져감) --- // Godot 스크립트에서 JavaScriptBridge.eval("window.getSongDataForGodot()") 등으로 이 함수를 호출합니다.

  const getSongDataForGodot = () => {
    console.log("Godot가 곡 정보를 요청했습니다."); // TODO: 실제 곡 정보를 가져오거나 준비하는 로직 구현 // 이 함수는 Next.js 페이지의 상태, props, 또는 별도의 데이터 fetching 로직에서 // 플레이할 곡의 정보를 가져와 Godot가 이해할 수 있는 형태로 반환해야 합니다. // 여기서는 더미 데이터를 반환합니다. 실제 데이터 구조와 Godot 스크립트에서 기대하는 // 데이터 구조(Variant 타입)에 맞게 변경해야 합니다.

    const songData = {
      name: "Sample Song",

      bpm: 120.0, // Godot에서 실수형으로 받을 수 있도록 소수점 포함

      difficulty: "Easy",

      artist: "Sample Artist",

      chart_data: [1, 0, 2, 1, 3, 0, 2, 3], // 배열 형태 (Godot에서는 PoolIntArray 등으로 변환 필요) // 필요시 오디오 파일 경로 또는 데이터도 포함

      audio_path: "/game/sample_song.mp3", // public/game 폴더에 오디오 파일이 있다면 이렇게 경로 지정
    };

    console.log("곡 정보 반환:", songData); // Godot의 JavaScriptBridge.eval_as_variant()는 JS 객체를 Variant로 변환해 줍니다.

    return songData;
  }; // --- Godot -> Next.js: 게임 결과 수신 함수 (Godot가 호출하여 전달) --- // Godot 스크립트에서 JavaScriptBridge.eval("window.handleGameResults('...')") 등으로 이 함수를 호출합니다. // Godot에서 JSON 문자열로 데이터를 변환하여 전달하는 것이 일반적입니다.

  const handleGameResults = (resultsJsonString: string) => {
    console.log("Godot가 게임 결과를 전송했습니다:", resultsJsonString);

    try {
      const results = JSON.parse(resultsJsonString); // JSON 문자열 파싱

      console.log("파싱된 게임 결과:", results); // TODO: 파싱된 결과 데이터를 사용하여 Next.js 로직 구현 // - 점수, 노트 개수 등을 UI (예: 결과 페이지)에 표시 // - 플레이어 UUID와 함께 블록체인 기록 로직 호출 (비동기 처리 필요) // results 객체는 Godot 스크립트에서 JSON 문자열로 만들 때의 구조와 일치합니다. // 예: results.score, results.perfect, results.player_uuid 등

      alert(
        `게임 종료! 점수: ${results.score || "N/A"}\nPerfect: ${
          results.perfect || 0
        }, Great: ${results.great || 0}, Good: ${results.good || 0}, Miss: ${
          results.miss || 0
        }\n플레이어 UUID: ${results.player_uuid || "알 수 없음"}`
      ); // 테스트용 알림
    } catch (e) {
      console.error("게임 결과 JSON 파싱 오류:", e);

      alert("게임 결과 수신 오류!");
    }
  };

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) {
      console.error("Canvas or container ref is null.");

      return;
    } // --- Godot 스크립트가 호출할 JS 함수들을 window 객체에 노출 --- // Godot의 JavaScriptBridge는 window 객체에 정의된 함수를 찾습니다.

    console.log("Godot가 호출할 JS 함수들을 window 객체에 노출합니다.");

    (window as any).getSongDataForGodot = getSongDataForGodot; // 곡 정보 요청 함수 노출

    (window as any).handleGameResults = handleGameResults; // 게임 결과 수신 함수 노출 // TODO: 필요시 Godot에서 호출할 다른 JS 함수들도 여기에 노출 // 로딩 프로세스가 아직 시작되지 않은 경우에만 진입

    if (godotScriptState.current === "idle") {
      godotScriptState.current = "loading"; // 상태를 loading으로 변경

      console.log("Attempting to load Godot engine script...");

      const engineScript = document.createElement("script");

      engineScript.src = scriptSrc; // 전역 변수 scriptSrc를 사용

      engineScript.src = scriptSrc; // 이 변수를 src로 설정

      engineScript.onload = async () => {
        console.log("Godot engine script loaded.");

        await new Promise((resolve) => setTimeout(resolve, 0)); // 마이크로태스크 실행 허용

        if (
          typeof window.Engine === "undefined" ||
          typeof window.Godot === "undefined"
        ) {
          console.error(
            "Godot Engine or Godot variable not found after script load."
          );

          godotScriptState.current = "error";

          const statusDiv = document.getElementById("status");

          const statusNoticeDiv = document.getElementById("status-notice");

          if (statusDiv) statusDiv.style.visibility = "visible";

          if (statusNoticeDiv) {
            statusNoticeDiv.style.display = "block";

            statusNoticeDiv.innerText =
              "Godot Engine 또는 Godot 객체를 찾을 수 없습니다. 스크립트 로딩 문제일 수 있습니다.";
          }

          return;
        }

        const GODOT_MAIN_CONFIG = {
          canvas: canvasRef.current,

          canvasResizePolicy: 2,

          executable: "/game/index", // Engine.init의 basePath

          args: ["--main-pack", "index.pck"], // callMain 인자

          fileSizes: { "index.pck": 3887728, "index.wasm": 52126319 }, // File sizes

          locateFile: (path: string, scriptDirectory: string) => {
            const fullPath = `/game/${path}`; // console.log(`Locating file via config: ${path}. Mapping to ${fullPath}`);

            return fullPath;
          },

          focusCanvas: true,

          gdextensionLibs: [],

          onExit: (code: number) => {
            console.log("Godot game exited with code:", code);

            godotEngine = null;

            godotScriptState.current = "idle"; // 상태를 idle로 리셋
          },

          onProgress: (current: number, total: number) => {
            const statusDiv = document.getElementById("status");

            const progressBar = document.getElementById(
              "status-progress"
            ) as HTMLProgressElement;

            const splashImg = document.getElementById(
              "status-splash"
            ) as HTMLImageElement;

            const noticeDiv = document.getElementById("status-notice");

            if (statusDiv) {
              statusDiv.style.visibility =
                current < total || total === 0 ? "visible" : "hidden";

              if (noticeDiv) noticeDiv.style.display = "none";
            }

            if (progressBar) {
              if (total > 0) {
                progressBar.style.display = "block";

                progressBar.value = current;

                progressBar.max = total;
              } else {
                progressBar.style.display = "none";

                progressBar.removeAttribute("value");

                progressBar.removeAttribute("max");
              }
            }

            if (splashImg) {
              splashImg.style.display =
                current < total || total === 0 ? "block" : "none";
            }
          },

          print: console.log.bind(console),

          printErr: console.error.bind(console),

          noExitRuntime: false,

          quit: (status: number, toThrow: any) => {
            console.error(`Godot quit with status ${status}:`, toThrow);

            if (GODOT_MAIN_CONFIG.onExit) {
              GODOT_MAIN_CONFIG.onExit(status);
            }
          },
        };

        try {
          console.log(
            "Creating Godot Engine instance with config:",

            GODOT_MAIN_CONFIG
          );

          godotEngine = new window.Engine(GODOT_MAIN_CONFIG);

          console.log(
            "Manually initializing and preloading files via Engine instance methods..."
          );

          await godotEngine.init(GODOT_MAIN_CONFIG.executable); // basePath: "/game/index"

          await godotEngine.preloadFile("/game/index.pck", "index.pck"); // Web path: '/game/index.pck'

          await godotEngine.start(); // callMain

          console.log("Godot game started successfully.");

          godotScriptState.current = "loaded"; // --- 로딩 상태 오버레이 숨기는 로직 추가 ---

          const statusDiv = document.getElementById("status");

          const progressBar = document.getElementById("status-progress");

          const splashImg = document.getElementById("status-splash");

          const noticeDiv = document.getElementById("status-notice");

          if (statusDiv) {
            statusDiv.style.visibility = "hidden"; // 전체 오버레이 숨김

            statusDiv.style.display = "none"; // 레이아웃 공간 차지 않도록 display도 none
          }

          if (progressBar) progressBar.style.display = "none";

          if (splashImg) splashImg.style.display = "none";

          if (noticeDiv) noticeDiv.style.display = "none";

          console.log("Godot loading overlay should be hidden now."); // TODO: 게임 시작 후, 필요하다면 여기서 JS -> Godot 방향으로 첫 통신 시작 // Godot 스크립트의 _ready()에서 getSongDataForGodot()를 호출하도록 구현했다면 별도 JS -> Godot 호출 불필요 // 만약 JS에서 "게임 시작 및 곡 로딩" 신호를 보내야 한다면 여기에 해당 Godot 함수 호출 로직 추가 // (Godot 스크립트에서 JavaScriptBridge로 호출 가능하게 만들어야 함) // 예: (window as any).startGameInGodot?(initialData); // Godot에서 노출한 함수 호출
        } catch (error) {
          console.error("Error starting Godot game:", error);

          godotScriptState.current = "error";

          const statusDiv = document.getElementById("status");

          const statusNoticeDiv = document.getElementById("status-notice");

          if (statusDiv) statusDiv.style.visibility = "visible";

          if (statusNoticeDiv) {
            statusNoticeDiv.style.display = "block";

            statusNoticeDiv.innerText = `게임 로딩 중 오류 발생: ${
              error instanceof Error ? error.message : String(error)
            }`;
          }
        }
      };

      engineScript.onerror = (error) => {
        console.error("Error loading Godot engine script:", error);

        godotScriptState.current = "error";

        const statusDiv = document.getElementById("status");

        const statusNoticeDiv = document.getElementById("status-notice");

        if (statusDiv) statusDiv.style.visibility = "visible";

        if (statusNoticeDiv) {
          statusNoticeDiv.style.display = "block";

          statusNoticeDiv.innerText = "Godot 엔진 스크립트 로딩 중 오류 발생";
        }
      }; // 스크립트가 문서에 아직 추가되지 않았을 경우에만 head에 추가

      const existingScript = document.querySelector(
        `script[src="${scriptSrc}"]`
      ); // scriptSrc 변수 사용

      if (!existingScript) {
        console.log(`Appending script: ${scriptSrc}`); // scriptSrc 변수 사용

        document.head.appendChild(engineScript); // 스크립트 요소 추가
      } else {
        console.warn(
          `Script ${scriptSrc} already exists in <head>. Skipping append.`
        ); // scriptSrc 변수 사용 // Fast Refresh 등으로 인해 스크립트가 이미 존재하지만 상태가 idle인 경우 // (컴포넌트가 파괴되었다가 다시 마운트된 경우 등) // 로딩 프로세스는 이미 위에서 godotScriptState로 제어되므로 여기서 추가 로직 불필요
      }
    } else {
      // godotScriptState.current !== 'idle'

      // 로딩 중이거나 로딩 완료, 오류 상태일 때 컴포넌트 리렌더링 시 이 블록 실행

      console.log(
        `Godot script state is ${godotScriptState.current}. Skipping load process start.`
      ); // 로딩 완료 상태이고 캔버스 포커스가 필요하다면 시도

      if (
        godotScriptState.current === "loaded" &&
        canvasRef.current &&
        document.activeElement !== canvasRef.current
      ) {
        // console.log("Refocusing canvas.");
        // canvasRef.current.focus();
      }
    } // Cleanup function

    return () => {
      console.log("Cleaning up Godot Engine..."); // Godot 게임 종료 요청

      if (godotEngine && godotEngine.requestQuit) {
        console.log("Requesting Godot game quit...");

        godotEngine.requestQuit(); // onExit 콜백에서 상태를 idle로 리셋 (혹은 여기서 직접)
      } else {
        console.log("No Godot engine instance to quit."); // Engine 인스턴스가 만들어지지 않은 상태에서 클린업이 실행된 경우 // 상태가 로딩중, 오류중일 수 있으므로 idle로 리셋 보장

        if (godotScriptState.current !== "idle") {
          console.warn(
            `Cleanup running, state is ${godotScriptState.current}. Resetting to idle.`
          );

          godotScriptState.current = "idle";
        }
      } // 추가했던 스크립트 태그 제거 (Fast Refresh 문제 완화 목적)

      const existingScript = document.querySelector(
        `script[src="${scriptSrc}"]`
      ); // scriptSrc 변수 사용

      if (existingScript) {
        console.log(`Removing script: ${scriptSrc}`); // scriptSrc 변수 사용

        existingScript.remove();
      } else {
        console.log(`Script ${scriptSrc} not found in <head> for removal.`); // scriptSrc 변수 사용
      } // --- window 객체에 노출했던 JS 함수들 정리 ---

      console.log("window 객체에 노출했던 JS 함수들을 정리합니다.");

      delete (window as any).getSongDataForGodot;

      delete (window as any).handleGameResults; // TODO: 추가했던 다른 JS 함수들도 여기서 제거

      godotEngine = null; // 엔진 참조 해제 // 최종적으로 상태를 idle로 보장 리셋

      if (godotScriptState.current !== "idle") {
        console.warn(
          `Final state check during cleanup, state is ${godotScriptState.current}. Resetting to idle.`
        );

        godotScriptState.current = "idle";
      }

      console.log("Cleanup finished.");
    };
  }, []); // Dependency array remains empty // ... (return JSX with loading UI는 그대로 둡니다)

  return (
    <div
      ref={containerRef}
      style={{
        width: "100vw",

        height: "100vh",

        overflow: "hidden",

        position: "relative",
      }}
    >
            {/* Godot 게임이 렌더링될 canvas */}     {" "}
      <canvas
        ref={canvasRef}
        id="canvas"
        style={{ width: "100%", height: "100%", display: "block" }}
      ></canvas>
            {/* 로딩 상태 표시 div (index.html의 스타일 참고) */}     {" "}
      <div
        id="status"
        style={{
          position: "absolute",

          left: 0,

          right: 0,

          top: 0,

          bottom: 0,

          backgroundColor: "#242424",

          color: "white",

          display: "flex",

          flexDirection: "column",

          justifyContent: "center",

          alignItems: "center",

          visibility: "hidden",
        }}
      >
               {" "}
        <img
          id="status-splash"
          style={{ maxHeight: "100%", maxWidth: "100%", margin: "auto" }}
          src="/game/index.png"
          alt=""
        />
               {" "}
        <progress
          id="status-progress"
          style={{ width: "50%", margin: "0 auto", display: "none" }}
        ></progress>
               {" "}
        <div
          id="status-notice"
          style={{
            backgroundColor: "#5b3943",

            borderRadius: "0.5rem",

            border: "1px solid #9b3943",

            color: "#e0e0e0",

            fontFamily: '"Noto Sans", "Droid Sans", Arial, sans-serif',

            lineHeight: 1.3,

            margin: "0 2rem",

            overflow: "hidden",

            padding: "1rem",

            textAlign: "center",

            zIndex: 1,

            display: "none",
          }}
        ></div>
             {" "}
      </div>
         {" "}
    </div>
  );
};

export default GodotGame;
