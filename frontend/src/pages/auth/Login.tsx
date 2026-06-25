import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import api from '@/services/api';

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});
type FormData = z.infer<typeof schema>;

export default function Login() {
  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPass, setShowPass] = useState(false);
  const from = (location.state as { from?: string })?.from || '/';

  const [stats, setStats] = useState({ totalMakers: 0, totalProducts: 0, totalOrders: 0 });

  useEffect(() => {
    api.get('/stats').then(r => {
      setStats((r.data as { data: typeof stats }).data);
    }).catch(() => {});
  }, []);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const result = await login(data.email, data.password);
      success('Login realizado!', 'Bem-vindo de volta!');
      const dashPath =
        result.user.role === 'ADMIN' ? '/admin' :
        result.user.role === 'MAKER' ? '/dashboard/maker' :
        '/dashboard/client';
      navigate(from !== '/' ? from : dashPath);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } }; code?: string };

      let msg: string;
      if (!axiosErr.response) {
        msg = 'Não foi possível conectar ao servidor. Verifique se o backend está rodando (iniciar.bat).';
      } else {
        const serverMsg = axiosErr.response.data?.message ?? '';
        if (serverMsg.includes('suspensa') || serverMsg.includes('desativada')) {
          msg = serverMsg; // Show the suspension message exactly
        } else if (axiosErr.response.status === 401) {
          msg = 'E-mail ou senha incorretos.';
        } else {
          msg = serverMsg || 'Erro ao entrar. Tente novamente.';
        }
      }
      error('Erro ao entrar', msg);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="text-center relative z-10">
            <img src="/logo.jpg" alt="PrintHub3D" className="w-20 h-20 rounded-2xl object-contain bg-white p-2 mx-auto mb-8" />
            <h1 className="text-4xl font-black text-white mb-4">
              Print<span className="gradient-text">Hub3D</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-sm">
              O marketplace de impressão 3D mais completo do Brasil.
            </p>
            <div className="grid grid-cols-3 gap-4 mt-12">
              {[
                { value: stats.totalMakers.toLocaleString('pt-BR'),   label: 'Makers' },
                { value: stats.totalProducts.toLocaleString('pt-BR'), label: 'Produtos' },
                { value: stats.totalOrders.toLocaleString('pt-BR'),   label: 'Pedidos' },
              ].map(({ value, label }) => (
                <div key={label} className="glass rounded-xl p-4 border border-white/5 text-left">
                  <div className="text-xl font-bold gradient-text">{value}</div>
                  <div className="text-xs text-gray-400">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="absolute top-1/4 right-10 w-64 h-64 bg-neon-blue/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-10 w-48 h-48 bg-neon-purple/10 rounded-full blur-3xl" />
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <Link to="/" className="flex items-center gap-2 mb-10 lg:hidden">
            <img src="/logo.jpg" alt="PrintHub3D" className="w-8 h-8 rounded-lg object-contain bg-white p-0.5" />
            <span className="font-bold text-white text-xl">Print<span className="gradient-text">Hub3D</span></span>
          </Link>

          <div className="mb-8">
            <h2 className="text-3xl font-black text-white">Bem-vindo de volta</h2>
            <p className="text-gray-400 mt-2">Entre na sua conta para continuar</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              icon={<Mail size={16} />}
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Senha"
              type={showPass ? 'text' : 'password'}
              placeholder="Sua senha"
              icon={<Lock size={16} />}
              rightIcon={
                <button type="button" onClick={() => setShowPass(!showPass)} className="hover:text-white">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              error={errors.password?.message}
              {...register('password')}
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-white/5 text-neon-blue" />
                Lembrar de mim
              </label>
              <Link to="/forgot-password" className="text-sm text-neon-blue hover:underline">
                Esqueci a senha
              </Link>
            </div>

            <Button type="submit" loading={isSubmitting} className="w-full">
              Entrar
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              Não tem conta?{' '}
              <Link to="/register" className="text-neon-blue hover:underline font-medium">
                Cadastrar grátis
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
