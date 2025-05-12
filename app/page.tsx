// app/page.tsx
"use client";
import dynamic from "next/dynamic";

// GodotGame 컴포넌트를 클라이언트 측에서만 동적으로 로딩합니다.
// ssr: false 옵션이 서버 사이드 렌더링을 비활성화합니다.
const GodotGame = dynamic(() => import("@/app/components/GodotGame"), {
  ssr: false,
  // 게임 로딩 중에 보여줄 내용을 여기에 정의할 수 있습니다. (선택 사항)
  // loading: () => <p>Loading game...</p>,
});

export default function Page() {
  return (
    <main className="flex min-h-screen overflow-hidden">
      {/* GodotGame 컴포넌트는 이제 클라이언트에서만 렌더링됩니다. */}
      <GodotGame />
    </main>
  );
}
