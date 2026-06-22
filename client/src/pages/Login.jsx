import { Activity, Eye, EyeOff, Mail, User, Lock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext.jsx';

const SLIDES = [
  {
    image: 'https://i.pinimg.com/736x/fa/f3/4c/faf34c402c87640cccd3ef036bde7ad2.jpg',
    tagline: 'Track trends in real time',
  },
  {
    image: 'https://i.pinimg.com/736x/97/00/7e/97007e3fd47f8b3b8eca003b2805b2c2.jpg',
    tagline: "See what's moving right now",
  },
  {
    image: 'https://i.pinimg.com/736x/ad/82/75/ad8275f28da2d1a66ebfad2c4a5e8af8.jpg',
    tagline: 'Stay ahead of the headlines',
  },
];

function SlidePhotos({ active }) {
  return (
    <>
      {SLIDES.map((s, i) => (
        <div
          key={s.image}
          className={`lw-slide absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
            i === active ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ backgroundImage: `url(${s.image})` }}
          role="img"
          aria-label={s.tagline}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-slate-950/10" />
      <div className="absolute inset-0 bg-blue-900/20 mix-blend-multiply" />
    </>
  );
}

function SlideCaption({ active }) {
  return (
    <div className="absolute inset-x-5 bottom-5 text-white lg:inset-x-12 lg:bottom-12">
      <p className="text-base font-semibold drop-shadow-sm lg:text-lg">{SLIDES[active].tagline}</p>
      <div className="mt-2 flex gap-1.5">
        {SLIDES.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i === active ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function InputField({ label, icon, rightElement, children }) {
  return (
    <div className="mb-3.5">
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <div className="relative flex items-center">
        <span className="pointer-events-none absolute left-3.5 text-slate-400">{icon}</span>
        {children}
        {rightElement && <span className="absolute right-3.5">{rightElement}</span>}
      </div>
    </div>
  );
}

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [slide, setSlide] = useState(0);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 3500);
    return () => clearInterval(id);
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isSignup) {
        await signup(name, email, password);
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (isSignup ? 'Unable to create account.' : 'Unable to sign in. Check credentials.')
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100';

  return (
    <main className="min-h-screen bg-white text-slate-900 lg:grid lg:h-screen lg:grid-cols-2 lg:overflow-hidden">

      {/* ── MOBILE LAYOUT: stacked full-screen ── */}
      <div className="flex flex-col lg:contents">

        {/* Slide panel — top half on mobile, right column on desktop */}
        <div className="relative h-[45vh] w-full overflow-hidden lg:order-2 lg:h-full lg:rounded-l-3xl">
          <SlidePhotos active={slide} />

          {/* Logo badge — visible on mobile inside the slide */}
          <div className="absolute left-4 top-4 flex items-center gap-2 lg:hidden">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-blue-600 text-white shadow-md">
              <Activity size={16} />
            </div>
            <span className="text-sm font-semibold text-white drop-shadow">TrendWatch</span>
          </div>

          <SlideCaption active={slide} />
        </div>

        {/* Form panel — bottom half on mobile, left column on desktop */}
        <div className="flex flex-1 flex-col overflow-y-auto bg-white px-5 pb-8 pt-6 lg:order-1 lg:h-screen lg:px-16 lg:py-8">

          {/* Logo — desktop only */}
          <div className="mb-auto hidden items-center gap-2.5 lg:flex">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-600 text-white">
              <Activity size={18} />
            </div>
            <span className="text-lg font-semibold">TrendWatch</span>
          </div>

          {/* Form centred */}
          <form
            onSubmit={handleSubmit}
            className="mx-auto w-full max-w-sm lg:my-auto"
          >
            <p className="text-sm text-slate-400">{isSignup ? 'Start your journey' : 'Welcome back'}</p>
            <h1 className="mb-5 mt-1 text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
              {isSignup ? 'Create your account' : 'Sign in to TrendWatch'}
            </h1>

            {isSignup && (
              <InputField label="Full name" icon={<User size={18} />}>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={isSignup}
                  placeholder="Jane Doe"
                  className={inputClass}
                />
              </InputField>
            )}

            <InputField label="Email address" icon={<Mail size={18} />}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className={inputClass}
              />
            </InputField>

            <InputField
              label="Password"
              icon={<Lock size={18} />}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  className="text-slate-400 transition-colors hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            >
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={isSignup ? 8 : 6}
                placeholder={isSignup ? 'At least 8 characters' : '••••••••'}
                className={inputClass}
              />
            </InputField>

            {error && (
              <p className="mb-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
                {error}
              </p>
            )}

            <button
              disabled={loading}
              className="mt-2 h-12 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60"
            >
              {loading
                ? isSignup
                  ? 'Creating account…'
                  : 'Signing in…'
                : isSignup
                ? 'Create account'
                : 'Sign in'}
            </button>

            <p className="mt-4 text-center text-sm text-slate-500">
              {isSignup ? 'Already have an account? ' : "Don't have an account? "}
              <button
                type="button"
                onClick={() => setIsSignup((v) => !v)}
                className="font-semibold text-blue-600 hover:underline"
              >
                {isSignup ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </form>

          {/* spacer so content doesn't hug bottom on tall phones */}
          <div className="mt-auto hidden lg:block" />
        </div>
      </div>

      <style>{`
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 1000px #f8fafc inset;
          -webkit-text-fill-color: #0f172a;
        }
        @media (prefers-reduced-motion: reduce) {
          .lw-slide { transition: none !important; }
        }
      `}</style>
    </main>
  );
}