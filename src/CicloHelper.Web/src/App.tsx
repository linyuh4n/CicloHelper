import { useEffect, useState } from "react";
import "./App.css";

interface HealthResponse {
  status: string;
  checks: Array<{
    name: string;
    status: string;
    description?: string;
    duration: number;
  }>;
  totalDuration: number;
}

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHealth() {
      try {
        const response = await fetch("https://localhost:7001/health", {
          method: "GET",
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setHealth(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchHealth();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">CicloHelper</span>
            </div>
            <nav className="flex items-center gap-4">
              <a href="#" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
                Dashboard
              </a>
              <a href="#" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
                Calendário
              </a>
              <a href="#" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
                Diário
              </a>
              <a href="#" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
                Nutrição
              </a>
              <a href="#" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
                Exercícios
              </a>
              <button className="btn-primary">Entrar</button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight mb-6">
            Acompanhe seu ciclo com <span className="text-primary">inteligência</span> e <span className="text-primary">cuidado</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-10">
            CicloHelper é sua plataforma completa para acompanhamento menstrual, bem-estar, diário pessoal, nutrição e exercícios.
            Desenvolvido com privacidade e segurança como prioridade.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="btn-primary text-lg px-8 py-3">Começar Grátis</button>
            <button className="btn-outline text-lg px-8 py-3">Saiba Mais</button>
          </div>
        </div>

        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Funcionalidades</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon="calendar"
              title="Acompanhamento Menstrual"
              description="Registre seu ciclo, fluxo, sintomas e humor. Obtenha previsões precisas baseadas no seu histórico."
            />
            <FeatureCard
              icon="book"
              title="Diário Pessoal"
              description="Escreva anotações diárias, registre sentimentos e acompanhe seu bem-estar emocional ao longo do tempo."
            />
            <FeatureCard
              icon="brain"
              title="Previsões Inteligentes"
              description="Algoritmos que aprendem com seu padrão para prever próximas menstruações, janela fértil e TPM."
            />
            <FeatureCard
              icon="apple"
              title="Nutrição"
              description="Acompanhe sua alimentação, hidratação e suplementos. Receba recomendações baseadas na fase do ciclo."
            />
            <FeatureCard
              icon="dumbbell"
              title="Exercícios"
              description="Planeje treinos adequados para cada fase do ciclo. Otimize performance e recuperação."
            />
            <FeatureCard
              icon="shield"
              title="Privacidade Total"
              description="Seus dados são criptografados, nunca compartilhados e você tem controle total. LGPD compliant."
            />
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Status do Sistema</h2>
          <div className="max-w-3xl mx-auto">
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">Health Check da API</h3>
              </div>
              <div className="card-content">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
                    <span className="ml-3 text-gray-600">Verificando status da API...</span>
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <p className="text-gray-600 mb-2">Não foi possível conectar à API</p>
                    <p className="text-sm text-gray-500">{error}</p>
                    <p className="text-sm text-gray-400 mt-2">Certifique-se de que o backend está rodando em https://localhost:7001</p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-gray-700">Status Geral</span>
                      <span className={`badge ${health?.status === "Healthy" ? "badge-success" : "badge-error"}`}>
                        {health?.status === "Healthy" ? "Saudável" : "Degradado"}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {health?.checks.map((check) => (
                        <div key={check.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${check.status === "Healthy" ? "bg-green-500" : "bg-red-500"}`}></div>
                            <span className="text-sm font-medium text-gray-900">{check.name}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span className={`badge ${check.status === "Healthy" ? "badge-success" : "badge-error"}`}>
                              {check.status === "Healthy" ? "OK" : "Falha"}
                            </span>
                            <span>{check.duration.toFixed(1)}ms</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-4 text-right">Tempo total: {health?.totalDuration.toFixed(1)}ms</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-gray-900">CicloHelper</span>
              </div>
              <p className="text-gray-600 text-sm">
                Acompanhamento menstrual inteligente com privacidade e segurança.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-primary transition-colors">Funcionalidades</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Preços</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Roadmap</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Changelog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-primary transition-colors">Sobre</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Carreiras</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contato</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-primary transition-colors">Privacidade</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Cookies</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">LGPD</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>© 2026 CicloHelper. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

function FeatureCard({ icon: IconName, title, description }: FeatureCardProps) {
  const icons: Record<string, React.ReactElement> = {
    calendar: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    book: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>,
    brain: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
    apple: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3c-1.5 0-2.864.395-3.982 1.046M15 14c.825 1.371 1.444 3.164.826 4.825M15 14c-.775-1.232-1.638-2.542-2.622-3.62M15 14V6a3 3 0 10-6 0v2m12 8v1m-6 0v1m4.538-4.46l-1.16.342m-2.847-1.16l.342 1.16" /></svg>,
    dumbbell: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.429 15.429a12.061 12.061 0 01-1.587 3.503m-.243-4.77a12.059 12.059 0 01-1.45-2.427m-1.044 8.289c-.443 1.074-1.108 2.063-1.98 2.917M21 12.865V21M21 21H3M9.59 4.86A10.97 10.97 0 005.41 9.342m5.672-3.324c.372-.29.76-.562 1.158-.813m2.447 2.447c.371-.291.743-.607 1.106-.946m.262-4.484c1.073-.62 2.237-.987 3.43-.987a8.06 8.06 0 013.225.743M3 10.59V21M3 21H21" /></svg>,
    shield: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  };

  return (
    <div className="card p-6 hover:shadow-md transition-shadow">
      <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center text-primary mb-4">
        {icons[IconName] || icons.calendar}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

export default App;
