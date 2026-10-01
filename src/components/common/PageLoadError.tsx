import { reopenCurrentPage } from '../../utils/pageRecovery';

const PageLoadError = () => (
  <main className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center gap-4 p-6 text-center text-[#2C2825]">
    <h1 className="text-xl font-semibold">暫時無法開啟頁面</h1>
    <p>連線中斷或網站已更新，請重新開啟頁面。</p>
    <button className="rounded-xl bg-[#9F9586] px-6 py-3 text-white" onClick={() => void reopenCurrentPage()}>
      重新開啟
    </button>
    <a className="underline" href="/store">查看店家資訊</a>
  </main>
);

export default PageLoadError;

