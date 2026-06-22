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
          className={`lw-slide absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${i === active ? 'opacity-100' : 'opacity-0'}`}
          style={{ backgroundImage: `url(${s.image})` }}
          role="img"
          aria-label={s.tagline}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-slate-950/10" />
      <div className="absolute inset-0 bg-blue-900/20 mix-blend-multiply" />
    </>
  );
}

function SlideCaption({ active }) {
  return (
    <div className="absolute inset-x-2 bottom-2 text-white xs:inset-x-3 xs:bottom-3 sm:inset-x-4 sm:bottom-4 md:inset-x-6 md:bottom-6 lg:inset-x-12 lg:bottom-12">
      <p className="text-xs font-medium drop-shadow-sm xs:text-sm sm:text-base lg:text-lg">{SLIDES[active].tagline}</p>
      <div className="mt-2 flex gap-1 xs:mt-2.5 xs:gap-1.5 sm:mt-3">
        {SLIDES.map((_, i) => (
          <span
            key={i}
            className={`h-1 rounded-full transition-all duration-500 xs:h-1.5 ${i === active ? 'w-5 bg-white xs:w-6' : 'w-1 bg-white/40 xs:w-1.5'}`}
          />
        ))}
      </div>
    </div>
  );
}

function InputField({ label, icon, rightElement, children }) {
  return (
    <div className="mb-3 sm:mb-4">
      <label className="mb-1 block text-xs font-medium text-slate-700 sm:mb-1.5 sm:text-sm">{label}</label>
      <div className="relative flex items-center">
        <span className="pointer-events-none absolute left-3 text-slate-400 sm:left-3.5">{icon}</span>
        {children}
        {rightElement && (
          <span className="absolute right-3 sm:right-3.5">{rightElement}</span>
        )}
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
      setError(err.response?.data?.message || (isSignup ? 'Unable to create account.' : 'Unable to sign in. Check credentials.'));
    } finally {
      setLoading(false);
    }
  }
//
  const inputClass =
    'w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-10 py-2.5 text-xs text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 sm:rounded-xl sm:pl-10 sm:py-3 sm:text-sm';

  return (
    <main className="flex min-h-screen flex-col bg-white text-slate-900 lg:grid lg:h-screen lg:grid-cols-2 lg:overflow-hidden">
      {/* left: brand + form */}
      <div className="flex flex-1 flex-col overflow-y-auto bg-white px-4 py-4 sm:px-8 sm:py-6 md:px-12 lg:px-16 lg:py-8">

        {/* logo */}
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-600 text-white sm:h-9 sm:w-9">
            <Activity size={16} className="sm:hidden" />
            <Activity size={18} className="hidden sm:block" />
          </div>
          <span className="text-base font-semibold sm:text-lg">TrendWatch</span>
        </div>

        {/* mobile slide banner */}
        <div className="relative mt-4 h-32 w-full overflow-hidden rounded-xl sm:mt-5 sm:h-40 md:h-48 lg:hidden">
          <SlidePhotos active={slide} />
          <SlideCaption active={slide} />
        </div>

        {/* form */}
        <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-xs flex-1 flex-col justify-center py-3 sm:max-w-sm sm:py-4 md:py-5 lg:py-6">
          <p className="text-xs text-slate-400 sm:text-sm">{isSignup ? 'Start your journey' : 'Welcome back'}</p>
          <h1 className="mb-6 mt-2 text-xl font-bold leading-tight text-slate-900 sm:mb-8 sm:text-2xl md:text-[26px]">
            {isSignup ? 'Create your account' : 'Sign in to TrendWatch'}
          </h1>

          {isSignup && (
            <InputField label="Full name" icon={<User size={16} />}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={isSignup}
                placeholder="Jane Doe"
                className={inputClass}
              />
            </InputField>
          )}

          <InputField label="Email address" icon={<Mail size={16} />}>
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
            icon={<Lock size={16} />}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                className="text-slate-400 transition-colors hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
            <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600 sm:mb-4 sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm">
              {error}
            </p>
          )}

          <button
            disabled={loading}
            className="mt-1 h-10 w-full rounded-lg bg-blue-600 text-xs font-semibold text-white transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60 sm:mt-2 sm:h-12 sm:rounded-xl sm:text-sm"
          >
            {loading ? (isSignup ? 'Creating account…' : 'Signing in…') : isSignup ? 'Create account' : 'Sign in'}
          </button>

          {/* switch mode — centered, like other apps */}
          <p className="mt-4 text-center text-xs text-slate-500 sm:mt-6 sm:text-sm">
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
      </div>

      {/* right: full photo panel — desktop only */}
      <div className="relative hidden overflow-hidden rounded-l-3xl lg:block">
        <SlidePhotos active={slide} />
        <SlideCaption active={slide} />
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