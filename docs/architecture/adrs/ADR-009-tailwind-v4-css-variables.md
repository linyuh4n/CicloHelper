# ADR-009: Tailwind CSS v4 + CSS Variables para Design System

## Status
Accepted

## Context
Precisamos de um sistema de design consistente, mobile-first, com suporte a tema claro/escuro futuro, cores da marca (roxo/lilás), e componentes reutilizáveis.

## Decision
Usar **Tailwind CSS v4** com **CSS Variables** (`@theme`) para design tokens, e **CSS Layers** (`@layer`) para organização.

### Por que Tailwind v4?
- **Zero config** (CSS-first, sem `tailwind.config.js`)
- **CSS Variables nativas** para design tokens
- **Performance**: Lightning CSS (Rust-based), 10x mais rápido
- **Modern CSS**: `@layer`, `@theme`, `color-mix()`, `oklch()`
- **Tree-shaking** automático (apenas classes usadas)

### Design Tokens (CSS Variables)
```css
/* src/index.css */
@import "tailwindcss";

:root {
  --color-primary: #7c3aed;       /* Roxo principal */
  --color-primary-hover: #6d28d9;
  --color-primary-light: #ede9fe;
  --color-secondary: #0ea5e9;     /* Azul complementar */
  --color-secondary-hover: #0284c7;
  --color-accent: #f43f5e;        /* Rosa/vermelho para ações destrutivas */
  --color-accent-hover: #e11d48;
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
}

@theme {
  --color-primary: var(--color-primary);
  --color-primary-hover: var(--color-primary-hover);
  --color-primary-light: var(--color-primary-light);
  --color-secondary: var(--color-secondary);
  --color-secondary-hover: var(--color-secondary-hover);
  --color-accent: var(--color-accent);
  --color-accent-hover: var(--color-accent-hover);
  --color-success: var(--color-success);
  --color-warning: var(--color-warning);
  --color-error: var(--color-error);
}
```

### Component Classes (CSS Puro - sem @apply para custom)
```css
/* Tailwind v4 não suporta @apply para classes customizadas no @layer components */
/* Usar CSS padrão com variáveis do tema */

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: color 0.2s, background-color 0.2s, border-color 0.2s;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background-color: var(--color-primary-hover);
}

/* Cards, Inputs, Badges, etc. seguem mesmo padrão */
```

### Dark Mode (Futuro - Preparado)
```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-primary: #a78bfa;
    --color-primary-hover: #c084fc;
    --color-primary-light: #312e81;
    /* ... demais cores adaptadas */
  }
}

/* Ou via classe (manual toggle) */
.dark {
  --color-primary: #a78bfa;
  /* ... */
}
```

### Estrutura de Arquivos
```
src/
├── index.css          # Design tokens + component classes + utilities
├── App.css            # (vazio - mantido para compatibilidade)
├── components/
│   ├── ui/            # Componentes base (Button, Input, Card, Badge)
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   └── index.ts   # Barrel export
│   ├── layout/        # Header, Footer, Sidebar
│   └── features/      # Componentes de features específicas
```

### Componentes Base (React + Tailwind Classes)
```tsx
// components/ui/Button.tsx
interface ButtonProps {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export const Button = ({ 
  variant = "primary", 
  size = "md", 
  children, 
  onClick, 
  disabled, 
  className = "" 
}: ButtonProps) => {
  const base = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-primary text-white hover:bg-primary-hover focus:ring-primary",
    secondary: "bg-secondary text-white hover:bg-secondary-hover focus:ring-secondary",
    outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-500",
    ghost: "text-gray-700 hover:bg-gray-100 focus:ring-gray-500",
    destructive: "bg-error text-white hover:bg-red-600 focus:ring-error"
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };
  
  return (
    <button 
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
```

## Alternatives Considered

### Tailwind v3 + `tailwind.config.js`
- **Prós**: Maduro, `@apply` funciona
- **Contras**: Config JS, mais lento, menos recursos CSS modernos

### CSS Modules / Styled Components / Emotion
- **Prós**: Scoped CSS, TypeScript support
- **Contras**: Runtime overhead, bundle size, menos consistência com design tokens

### Plain CSS + CSS Variables
- **Prós**: Zero dependências, controle total
- **Contras**: Verboso, sem utilitários responsivos, reinventar roda

## Consequences

### Positivas
- ✅ **Design tokens centralizados** (cores, espaçamento, tipografia)
- ✅ **Mobile-first** nativo (`sm:`, `md:`, `lg:`, `xl:`)
- ✅ **Dark mode ready** via CSS Variables
- ✅ **Performance** (Lightning CSS, tree-shaking)
- ✅ **Developer Experience** (IntelliSense, hover docs)
- ✅ **Consistência** forçada por utilitários

### Negativas
- ⚠️ **Curva de aprendizado** (utility-first)
- ⚠️ **@apply limitado** no v4 para custom classes
- ⚠️ **HTML verboso** (muitas classes)

### Mitigações
- Componentes UI abstraem classes comuns
- Documentação de padrões comuns
- VS Code extension (Tailwind CSS IntelliSense)

## Related
- ADR-001: Clean Architecture (Frontend organization)
- ADR-011: shadcn/ui (planejado)
