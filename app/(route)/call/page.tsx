"use client";

import React, { useState, ChangeEvent, FormEvent } from "react";
import { useWriteContract } from "wagmi";
import type { WriteContractErrorType } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";

type TransactionResult = string | { error: string } | null;

export default function ContractTester() {
  const [contractAddress, setContractAddress] = useState<string>("");
  const [abi, setAbi] = useState<string>("");
  const [functionName, setFunctionName] = useState<string>("");
  const [args, setArgs] = useState<string>("");
  const [txResult, setTxResult] = useState<TransactionResult>(null);

  const { writeContractAsync, isPending, error } = useWriteContract();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setTxResult(null);

    let parsedArgs: unknown[] = [];
    let abiObj: any;

    try {
      parsedArgs = args ? JSON.parse(args) : [];
      abiObj = JSON.parse(abi);

      const result = await writeContractAsync({
        address: contractAddress as `0x${string}`,
        abi: abiObj,
        functionName,
        args: parsedArgs,
      });

      setTxResult(result);
    } catch (err: any) {
      console.error("Error during transaction preparation or execution:", err);
      setTxResult({ error: err.message });
    }
  };

  return (
    // 배경색 및 그림자 변경
    <div className="max-w-2xl mx-auto p-6 bg-primary rounded-xl shadow-md">
      <div className="mb-6 flex justify-between items-center">
        {/* 제목 색상 변경 */}
        <h2 className="text-2xl font-bold text-foreground">Contract Tester</h2>
        <ConnectButton />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          {/* 라벨 색상 변경 */}
          <label
            htmlFor="contractAddress"
            className="block text-sm font-medium text-foreground mb-1"
          >
            Deployed Contract Tester
          </label>
          <input
            id="contractAddress"
            type="text"
            value={contractAddress}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setContractAddress(e.target.value)
            }
            // 테두리 색상, 포커스 링 색상/테두리 색상 변경
            className="w-full px-3 py-2 border border-secondary rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-secondary" // 입력 텍스트 색상도 secondary로 변경
          />
        </div>

        <div>
          {/* 라벨 색상 변경 */}
          <label
            htmlFor="abi"
            className="block text-sm font-medium text-foreground mb-1"
          >
            ABI (JSON)
          </label>
          <textarea
            id="abi"
            value={abi}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
              setAbi(e.target.value)
            }
            // 테두리 색상, 포커스 링 색상/테두리 색상 변경
            className="w-full px-3 py-2 border border-secondary rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary h-32 text-secondary" // 입력 텍스트 색상도 secondary로 변경
          />
        </div>

        <div>
          {/* 라벨 색상 변경 */}
          <label
            htmlFor="functionName"
            className="block text-sm font-medium text-foreground mb-1"
          >
            Function Name
          </label>
          <input
            id="functionName"
            type="text"
            value={functionName}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setFunctionName(e.target.value)
            }
            // 테두리 색상, 포커스 링 색상/테두리 색상 변경
            className="w-full px-3 py-2 border border-secondary rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-secondary" // 입력 텍스트 색상도 secondary로 변경
          />
        </div>

        <div>
          {/* 라벨 색상 변경 */}
          <label
            htmlFor="args"
            className="block text-sm font-medium text-foreground mb-1"
          >
            Arguments (JSON array)
          </label>
          <input
            id="args"
            type="text"
            value={args}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setArgs(e.target.value)
            }
            placeholder='예: ["0x123...", 100, true]'
            // 테두리 색상, 포커스 링 색상/테두리 색상 변경
            className="w-full px-3 py-2 border border-secondary rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-secondary placeholder:text-secondary" // 입력 텍스트 색상 및 placeholder 색상 변경
          />
        </div>

        {/* 버튼 배경색, 호버 배경색, 텍스트 색상, 포커스 링 색상 변경 */}
        {/* 비활성화 시 opacity는 유지 */}
        <button
          type="submit"
          disabled={isPending || !contractAddress || !abi || !functionName}
          className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm  text-primary hover:text-background font-medium bg-secondary hover:bg-accent focus:outline-none hover:scale-[1.01] transition-colors ${
            isPending || !contractAddress || !abi || !functionName
              ? "opacity-70 cursor-not-allowed"
              : "cursor-pointer"
          }`}
        >
          {isPending ? "처리 중..." : "Execute Transaction"}
        </button>

        {/* Wagmi 훅 에러 (색상 유지) */}
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm break-words">
            Error:{" "}
            {(error as WriteContractErrorType).message ||
              error.name ||
              "알 수 없는 오류"}
          </div>
        )}

        {/* 결과 표시 영역 배경색, 제목 색상, 텍스트 색상 변경 */}
        {txResult && (
          <div className="mt-4 p-4 bg-secondary rounded-md overflow-x-auto break-words">
            {/* 제목 색상 변경 */}
            <h3 className="text-sm font-medium text-foreground mb-2">
              Transaction Result:
            </h3>
            {/* 결과 텍스트 색상 변경 */}
            <pre className="text-xs text-foreground whitespace-pre-wrap">
              {JSON.stringify(txResult, null, 2)}
            </pre>
          </div>
        )}
      </form>
    </div>
  );
}
