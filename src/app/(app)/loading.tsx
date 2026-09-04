export default function Loading() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#f4f5f8]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-[#4d3ab3]/20 border-t-[#4d3ab3] rounded-full animate-spin"></div>
        <div className="text-sm font-medium text-gray-500 animate-pulse">Loading...</div>
      </div>
    </div>
  )
}
