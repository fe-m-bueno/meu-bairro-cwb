export default function Loading() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-emerald-500" />
        <p className="text-sm text-muted-foreground">
          Carregando dados de Curitiba...
        </p>
      </div>
    </div>
  )
}
