// services/godotCommunication.ts

// Godot 스크립트에서 기대하는 곡 데이터의 타입 정의 (참고용)
interface SongData {
  name: string;
  bpm: number;
  difficulty: string;
  artist: string;
  chart_data: number[]; // 배열
  audio_path?: string; // 오디오 파일 경로 (필요시)
  [key: string]: any; // 추가적인 속성 허용
}

// Godot 스크립트가 전송하는 게임 결과의 타입 정의 (참고용)
interface GameResults {
  score: number;
  perfect: number;
  great: number;
  good: number;
  miss: number;
  player_uuid?: string; // 플레이어 UUID (필요시)
  [key: string]: any; // 추가적인 속성 허용
}

// --- Next.js -> Godot: 곡 정보 전달 함수 (Godot가 호출하여 가져감) ---
// 이 함수는 Godot 스크립트에서 JavaScriptBridge.eval("window.getSongDataForGodot()") 등으로 호출됩니다.
export const getSongDataForGodot = (): SongData => {
  console.log("Godot가 곡 정보를 요청했습니다. (서비스 함수 실행)");
  // TODO: 실제 곡 정보를 가져오거나 준비하는 로직 구현
  // 이 함수는 Next.js 페이지의 상태, props, 또는 별도의 데이터 fetching 로직에서
  // 플레이할 곡의 정보를 가져와 Godot가 이해할 수 있는 형태로 반환해야 합니다.
  // 여기서는 더미 데이터를 반환합니다. 실제 데이터 구조와 Godot 스크립트에서 기대하는
  // 데이터 구조(Variant 타입)에 맞게 변경해야 합니다.
  const songData: SongData = {
    name: "Sample Song from Service", // 함수 위치 확인용 메시지 추가
    bpm: 120.0,
    difficulty: "Easy",
    artist: "Sample Artist",
    chart_data: [1, 0, 2, 1, 3, 0, 2, 3],
    audio_path: "/game/sample_song.mp3",
  };
  console.log("서비스에서 곡 정보 반환:", songData);
  return songData;
};

// --- Godot -> Next.js: 게임 결과 수신 함수 (Godot가 호출하여 전달) ---
// Godot 스크립트에서 JavaScriptBridge.eval("window.handleGameResults('...')") 등으로 이 함수를 호출합니다.
// Godot에서 JSON 문자열로 데이터를 변환하여 전달하는 것이 일반적입니다.
export const handleGameResults = (resultsJsonString: string) => {
  console.log(
    "Godot가 게임 결과를 전송했습니다. (서비스 함수 실행):",
    resultsJsonString
  );
  try {
    const results: GameResults = JSON.parse(resultsJsonString);
    console.log("서비스에서 파싱된 게임 결과:", results);
    // TODO: 파싱된 결과 데이터를 사용하여 Next.js 로직 구현
    // - 점수, 노트 개수 등을 UI (예: 결과 페이지)에 표시
    // - 플레이어 UUID와 함께 블록체인 기록 로직 호출 (비동기 처리 필요)

    alert(
      `[Service] 게임 종료! 점수: ${results.score || "N/A"}\nPerfect: ${
        results.perfect || 0
      }, Great: ${results.great || 0}, Good: ${results.good || 0}, Miss: ${
        results.miss || 0
      }\n플레이어 UUID: ${results.player_uuid || "알 수 없음"}`
    ); // 테스트용 알림
  } catch (e) {
    console.error("서비스에서 게임 결과 JSON 파싱 오류:", e);
    alert("[Service] 게임 결과 수신 오류!");
  }
};

// 필요시 JS가 Godot 함수를 호출하는 로직도 여기에 정의할 수 있습니다.
// 하지만 Godot 측에서 JS에 노출하는 API 형태에 따라 구현 방식이 달라집니다.
// 예:
// export const startGameInGodot = (songData: SongData) => {
//     // Godot 인스턴스나 JavaScriptBridge를 통해 Godot 함수를 호출하는 로직
//     // 이 함수는 useGodotEngine 훅 등에서 Engine 인스턴스를 받은 후 호출될 수 있습니다.
// };
