// components/UserRegistration.tsx
"use client";

import React, { useState, FormEvent, ChangeEvent } from "react"; // 필요한 React 및 이벤트 타입 임포트
// Address 타입은 viem에서 임포트
import { useAccount, useWriteContract, useReadContract } from "wagmi"; // Wagmi 훅 임포트
import type { Address, WriteContractErrorType, BaseError } from "viem"; // <-- 이 줄을 수정합니다!
// import type { Address } from "wagmi"; // <-- 이 이전 시도는 삭제합니다.
// import type { WriteContractErrorType, BaseError } from "viem"; // <-- 이 이전 시도와 합칩니다.

// ABI 파일 임포트 (경로 확인)
import { UserManagerABI } from "@/public/abis/UserManagerABI";

// 유저 데이터 구조를 위한 인터페이스 정의
interface User {
  wallet: Address; // wallet 타입은 Address로 변경
  name: string;
  joinedAt: bigint; // 필요한 다른 필드들도 추가합니다.
}

// 컨트랙트 주소 - 타입은 Address로 변경
const userManagerAddress: Address =
  "0x9c1ad93d0646d6403aa34be6f725aeeb1c78d952";

export default function UserRegistration() {
  // useAccount 훅의 address는 Address | undefined 타입으로 잘 추론됩니다.
  const { address } = useAccount();
  const [name, setName] = useState<string>(""); // 유저 등록 트랜잭션 훅

  const {
    writeContract,
    isPending: isRegistering,
    error: registerError,
    data: txHash,
  } = useWriteContract(); // 유저 정보 읽기 훅

  const {
    data,
    refetch,
    isLoading: isUserLoading,
  } = useReadContract({
    address: userManagerAddress,
    abi: UserManagerABI,
    functionName: "getUser",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  }); // 폼 제출 핸들러

  const user = data as User | undefined;

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!address || !name) {
      console.log("Wallet not connected or name is empty.");
      return;
    }

    writeContract({
      address: userManagerAddress,
      abi: UserManagerABI,
      functionName: "registerUser",
      args: [address, name],
    });

    setTimeout(() => {
      console.log("Attempting to refetch user data...");
      refetch();
    }, 3000);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-primary rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-background">
        Register Yourself
      </h2>
      <form onSubmit={handleSubmit} className="space-y-1">
        <label htmlFor="name" className="block text-foreground">
          User Name
        </label>
        <input
          id="name"
          className="w-full px-3 py-2 border border-secondary rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary h-10 text-secondary"
          placeholder=""
          type="text"
          value={name}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setName(e.target.value)
          }
        />
        <button
          type="submit"
          disabled={isRegistering || !address || !name}
          className="mt-4 w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm  text-primary hover:text-black hover:cursor-pointer font-medium bg-secondary opacity-70 hover:bg-accent focus:outline-none hover:scale-[1.01] transition-colors"
        >
          {isRegistering ? "Journey begins..." : "Register"}
        </button>
        {registerError && (
          <div className="text-red-600 text-sm break-words">
            Error:
            {(registerError as BaseError).shortMessage ||
              registerError.message ||
              "알 수 없는 가입 오류 발생"}
          </div>
        )}
        {txHash && !registerError && (
          <div className="text-green-600 text-sm break-words">
            트랜잭션 전송됨: {txHash}
          </div>
        )}
      </form>
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-1 text-primary">내 정보</h3>
        {isUserLoading ? (
          <div className="text-foreground">불러오는 중...</div>
        ) : user &&
          user.wallet !== "0x0000000000000000000000000000000000000000" ? (
          <div className="border border-primary rounded p-4 bg-secondary text-foreground text-sm">
            <div>이름: {user.name}</div>
            {/* user.wallet은 Address 타입이므로 slice 사용 가능 */}
            <div>
              지갑:
              {`${user.wallet.slice(0, 6)}...${user.wallet.slice(-4)}`}
            </div>
            <div>가입일: {user.joinedAt.toString()}</div>
          </div>
        ) : (
          <div className="text-foreground">아직 가입되지 않았습니다.</div>
        )}
      </div>
    </div>
  );
}
