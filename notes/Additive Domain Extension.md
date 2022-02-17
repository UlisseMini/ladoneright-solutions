Let $V$ be a vector space and $\mathbf F$ denote $\mathbf{R}$ or $\mathbf{C}$ and let $f : V \to \mathbf F$ be defined such that $f(v+w) = f(v)+f(w)$.

Consider a ratio of naturals $n/m$ where $n,m \in \mathbf{N}$ - we have
$$
m \cdot f((n/m)v) = \underbrace{f((n/m)v) + \dots + f((n/m)v)}_{\text{$m$ times}} = f(nv)
$$
Implying $f((n/m)v) = (n/m)f(v)$. Negatives are easy to see by additivity
$$
f(-(n/m)v) + f((n/m)v)
\implies f(-(n/m)v) = -(n/m)f(v)
$$
Thus $f(rv) = rf(v)$ for all $r\in \mathbf{Q}$.