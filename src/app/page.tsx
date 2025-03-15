"use client";

import Image from "next/image";
import { useState } from "react";
import { registration } from "@/lib/client";

type Log = {
  data: string;
  message: string;
};

export default function Home() {
  // ログレコード達
  const [logs, setLogs] = useState<Log[]>([]);
  const pushLog = (log: string | object) => {
    setLogs((prevLogs) => {
      const newLog = {
        data: new Date().toLocaleString("ja-JP"),
        message: typeof log === "string" ? log : JSON.stringify(log, null, 2),
      };
      return [newLog, ...prevLogs];
    });
  };

  // パスキーの新規登録を開始する
  const startRegistration = async () => {
    // キー名を入力してもらう
    const keyName = prompt("Enter a key name");
    if (!keyName) {
      return;
    }

    // パスキー登録用のOptionsをAPIから取得
    const options = await registration.generateRegistrationOptions({
      key_name: keyName,
    });
    if (options instanceof Error) {
      pushLog(options.message);
      return;
    }
    pushLog(options);

    // デバイス認証を開始
    const resp = await registration.startRegistration(options);
    pushLog(resp);

    // デバイス認証の結果をAPIに送信してパスキー登録を完了する
    const verifiedResp = await registration.verifyRegistration(resp);
    pushLog(verifiedResp);
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      {/* ヘッダーの右端に青背景色に白文字の`Create SmartWallet`ボタンのみ表示 */}
      <header className="row-start-1 flex justify-end w-full">
        <button
          onClick={startRegistration}
          className="bg-blue-500 text-white font-semibold py-2 px-4 rounded"
        >
          Create SmartWallet
        </button>

        {/* デバイス認証結果送信だけをするボタン */}
      </header>
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        {/* ログをスクロール可能なテーブルで表示 */}
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left">Date</th>
              <th className="text-left pl-4">Message</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, index) => (
              <tr key={index}>
                {/* 時間は上詰めの折り返しなしで表示 */}
                <td className="text-left align-top whitespace-nowrap pb-4">
                  {log.data}
                </td>
                {/* メッセージは画面幅最大で後は折返しで表示 */}
                <td className="text-left pl-4 align-top break-all pb-4">
                  {log.message}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <ol className="list-inside list-decimal text-sm/6 text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
          <li className="mb-2 tracking-[-.01em]">
            Get started by editing{" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-[family-name:var(--font-geist-mono)] font-semibold">
              src/app/page.tsx
            </code>
            .
          </li>
          <li className="tracking-[-.01em]">
            Save and see your changes instantly.
          </li>
        </ol>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Deploy now
          </a>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read our docs
          </a>
        </div> */}
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
