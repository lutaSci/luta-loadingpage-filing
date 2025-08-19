import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft } from 'lucide-react';

const PaperDocument = ({ title, content }) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50/70 flex items-start justify-center p-6">
            <div className="w-full max-w-4xl">
                <div className="mb-4">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors duration-300 text-slate-700"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>返回首页</span>
                    </Link>
                </div>

                <div className="relative bg-white/40 backdrop-blur-xl border border-white/30 shadow-2xl rounded-3xl overflow-hidden">
                    <div className="absolute inset-0 pointer-events-none" style={{
                        background: 'radial-gradient(1200px 600px at 0% 0%, rgba(255,255,255,0.5), rgba(255,255,255,0)), radial-gradient(1200px 600px at 100% 100%, rgba(255,255,255,0.4), rgba(255,255,255,0))'
                    }} />

                    <div className="relative px-6 md:px-10 py-8 md:py-10">
                        <div className="mb-6">
                            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-800">
                                {title}
                            </h1>
                            <div className="mt-2 text-xs text-slate-500">
                                Document ID: {Date.now().toString(36).toUpperCase()}
                            </div>
                        </div>

                        <div className="prose max-w-none">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    h1: ({ children }) => (
                                        <h1 className="text-xl md:text-2xl font-semibold text-slate-800 mt-8 mb-4 first:mt-0">
                                            {children}
                                        </h1>
                                    ),
                                    h2: ({ children }) => (
                                        <h2 className="text-lg md:text-xl font-semibold text-slate-800 mt-6 mb-3">
                                            {children}
                                        </h2>
                                    ),
                                    h3: ({ children }) => (
                                        <h3 className="text-base md:text-lg font-semibold text-slate-800 mt-4 mb-2">
                                            {children}
                                        </h3>
                                    ),
                                    p: ({ children }) => (
                                        <p className="text-[15px] leading-7 text-slate-700 mb-4">
                                            {children}
                                        </p>
                                    ),
                                    ul: ({ children }) => (
                                        <ul className="list-disc pl-5 mb-4 space-y-1 text-slate-700">
                                            {children}
                                        </ul>
                                    ),
                                    ol: ({ children }) => (
                                        <ol className="list-decimal pl-5 mb-4 space-y-1 text-slate-700">
                                            {children}
                                        </ol>
                                    ),
                                    li: ({ children }) => (
                                        <li className="text-[15px] leading-7">{children}</li>
                                    ),
                                    a: ({ children, href }) => (
                                        <a href={href} className="text-slate-800 underline decoration-slate-400/50 underline-offset-4 hover:opacity-80 transition">
                                            {children}
                                        </a>
                                    ),
                                    strong: ({ children }) => (
                                        <strong className="font-semibold text-slate-900">{children}</strong>
                                    ),
                                    code: ({ children, inline }) =>
                                        inline ? (
                                            <code className="px-1 py-0.5 rounded bg-white/60 text-slate-800 border border-white/50">
                                                {children}
                                            </code>
                                        ) : (
                                            <pre className="p-4 rounded-xl bg-white/50 backdrop-blur-md border border-white/40 text-slate-800 overflow-x-auto shadow">
                                                <code>{children}</code>
                                            </pre>
                                        ),
                                    blockquote: ({ children }) => (
                                        <blockquote className="border-l-4 border-white/50 pl-4 text-slate-600 italic bg-white/30 rounded-r-xl py-2">
                                            {children}
                                        </blockquote>
                                    ),
                                    table: ({ children }) => (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                {children}
                                            </table>
                                        </div>
                                    ),
                                    th: ({ children }) => (
                                        <th className="px-3 py-2 text-slate-800 border-b border-white/40 bg-white/40">
                                            {children}
                                        </th>
                                    ),
                                    td: ({ children }) => (
                                        <td className="px-3 py-2 text-slate-700 border-b border-white/30">
                                            {children}
                                        </td>
                                    ),
                                }}
                            >
                                {content}
                            </ReactMarkdown>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaperDocument; 