import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container-page flex flex-1 flex-col items-start justify-center gap-4 py-24">
      <h1 className="text-3xl font-extrabold">Page not found</h1>
      <p className="text-muted">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <Link href="/" className="btn btn-primary">
        Go to the homepage
      </Link>
    </main>
  );
}
