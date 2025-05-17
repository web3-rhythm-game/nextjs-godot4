"use client";

import React, { JSX, useState, type ChangeEvent } from "react"; // ChangeEvent 타입을 임포트합니다.

export default function MusicSearchPage(): JSX.Element {
  // 컴포넌트 반환 타입을 명시합니다.
  // useState 훅에 명시적으로 string 타입을 지정합니다.
  const [cid, setCid] = useState<string>("");
  const [input, setInput] = useState<string>("");

  // 이벤트 핸들러 함수의 매개변수와 반환 타입을 명시합니다.
  const handleSearch = (): void => {
    // input 값이 비어있거나 공백만 있는 경우 검색을 실행하지 않습니다.
    if (!input.trim()) {
      console.warn("Input is empty or contains only whitespace."); // 사용자에게 보이지는 않지만 개발을 위해 경고를 추가할 수 있습니다.
      return;
    }
    // input 값을 trim() 한 결과를 cid 상태에 설정합니다.
    setCid(input.trim());
  };

  // input 요소의 onChange 핸들러 타입 명시
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setInput(e.target.value);
  };

  return (
    <div className="flex items-center justify-center px-4">
      <div className="bg-primary p-8 rounded-2xl shadow-xl w-full max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold text-center">🎵 IPFS 음악 검색기</h1>

        <input
          type="text"
          placeholder="IPFS 해시 (CID)를 입력하세요"
          value={input}
          onChange={handleInputChange} // 분리된 핸들러 함수 사용
          className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={handleSearch}
          // input 값이 비어있거나 공백만 있을 경우 버튼을 비활성화합니다.
          disabled={!input.trim()}
          className={`w-full py-2 rounded-xl transition ${
            !input.trim()
              ? "bg-secondary opacity-70 text-primary" // 비활성화 스타일
              : "bg-secondary opacity-70 hover:bg-accent hover:scale-[1.01] text-primary" // 활성화 스타일
          }`}
        >
          재생하기
        </button>

        {/* cid 상태가 있을 때만 오디오 플레이어를 렌더링합니다. */}
        {cid && (
          <div className="space-y-4">
            <p className="text-sm text-secondary break-all">CID: {cid}</p>
            {/* 오디오 소스 URL에 cid 값을 사용하여 IPFS 게이트웨이를 통해 음악을 로드합니다. */}
            {/* 안정적인 Public Gateway 사용을 권장합니다. cloudflare-ipfs.com이 자주 사용됩니다. */}
            <audio controls className="w-full">
              {/* type 속성을 동적으로 지정하거나, 가장 일반적인 audio/mpeg 등을 사용합니다. */}
              {/* CID에 따라 실제 파일 타입이 다를 수 있으므로 주의해야 합니다. */}
              <source
                src={`https://cloudflare-ipfs.com/ipfs/${cid}`}
                type="audio/mpeg"
              />
              {/* <source src={`https://ipfs.io/ipfs/${cid}`} type="audio/mpeg" /> */}
              {/* <source src={`https://gateway.pinata.cloud/ipfs/${cid}`} type="audio/mpeg" /> */}
              브라우저가 오디오 태그를 지원하지 않습니다.
            </audio>
            {/* 다른 게이트웨이를 사용하고 싶다면 아래 주석 처리된 부분을 활용하세요.
                         <audio controls className="w-full mt-2">
                            <source src={`https://ipfs.io/ipfs/${cid}`} type="audio/mpeg" />
                            대체 텍스트
                         </audio>
                         */}
          </div>
        )}
      </div>
    </div>
  );
}
