export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white px-4 py-3 text-center text-xs text-slate-500">
      © {new Date().getFullYear()} EstateCRM. All rights reserved.
    </footer>
  );
}