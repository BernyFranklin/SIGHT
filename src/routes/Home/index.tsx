import { useAppStore } from '@app/store/useAppStore';

export function Home() {
  const { count, increment } = useAppStore();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Home</h1>
      <p className="text-slate-300">Skeleton renderer is alive.</p>
      <button
        onClick={increment}
        className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-500"
      >
        Count: {count}
      </button>
    </div>
  );
}
