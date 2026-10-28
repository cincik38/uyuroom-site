import { Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { blogPosts, getBlogRoute } from '@/lib/blog';
import { BookOpen, ArrowRight } from 'lucide-react';

const BlogIndexPage = () => (
  <div className="min-h-screen bg-slate-100 flex flex-col">
    <Navbar />

    <section className="pt-28 pb-12 bg-slate-950 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(251,191,36,0.18),transparent_55%)]" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-4">
        <span className="inline-flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-widest">
          <BookOpen className="w-4 h-4" /> UYUROOM Blog
        </span>
        <h1 className="text-3xl sm:text-5xl font-black leading-tight max-w-3xl">
          Konaklama Rehberi, Şehir Önerileri ve Rezervasyon İpuçları
        </h1>
        <p className="text-slate-300 text-base max-w-2xl leading-relaxed">
          Adana ve Uşak başta olmak üzere konaklama deneyiminizi kolaylaştıracak rehberler,
          esnek ödeme seçenekleri ve doğrudan rezervasyonun avantajları.
        </p>
      </div>
    </section>

    <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
      {blogPosts.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogPosts.map((post) => {
            const hero =
              typeof post.frontmatter.hero_image === 'string'
                ? post.frontmatter.hero_image
                : typeof post.frontmatter.og_image === 'string'
                  ? post.frontmatter.og_image
                  : undefined;
            return (
              <article
                key={post.slug}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all"
              >
                {hero && (
                  <img
                    src={hero}
                    alt={post.title}
                    className="w-full h-44 object-cover"
                    loading="lazy"
                  />
                )}
                <div className="p-5 flex-1 flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    {post.frontmatter.date ? <span>{post.frontmatter.date}</span> : null}
                    {post.frontmatter.tags?.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-amber-100 px-2.5 py-0.5 text-amber-800 font-bold"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h2 className="text-lg font-black text-slate-900 leading-snug">
                    <Link className="hover:text-amber-600" to={getBlogRoute(post.slug)}>
                      {post.title}
                    </Link>
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 flex-1">
                    {post.description}
                  </p>
                  <Link
                    to={getBlogRoute(post.slug)}
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-600 hover:text-amber-700 min-h-[40px]"
                  >
                    Yazıyı Oku <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <h2 className="text-xl font-black text-slate-900">Henüz yazı yok</h2>
          <p className="mt-2 text-sm text-slate-600">
            Yeni içerikler yayınlandığında burada listelenecek.
          </p>
        </section>
      )}
    </main>

    <Footer />
  </div>
);

export default BlogIndexPage;
