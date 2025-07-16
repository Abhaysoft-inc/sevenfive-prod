import Image from "next/image";

export default function Home() {
  return (
    <>

      <div className="h-screen w-full bg-[#FDFBF6]">
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <h1 className="text-4xl font-bold mb-8">Welcome to SevenFive</h1>
          <div className="space-y-4">
            <a href="/signup" className="block text-[44px] text-blue-600 hover:text-blue-800">
              Signup
            </a>
            <a href="/admin" className="block text-[44px] text-green-600 hover:text-green-800">
              Admin Panel
            </a>
          </div>
        </div>
      </div>

    </>
  );
}
