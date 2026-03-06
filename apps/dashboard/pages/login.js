export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <form className="border p-6 rounded w-96 space-y-4">
        <h1 className="text-xl font-semibold">Login</h1>
        <input className="w-full border p-2" placeholder="Email" />
        <input className="w-full border p-2" placeholder="Password" type="password" />
        <button className="w-full bg-black text-white p-2 rounded">Sign In</button>
      </form>
    </div>
  );
}
