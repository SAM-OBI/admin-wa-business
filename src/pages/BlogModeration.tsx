import { useState, useEffect } from 'react';
import { 
  FiFileText, FiFlag, FiStar, FiSearch, 
  FiCheckCircle, FiXCircle, FiAlertTriangle,
  FiExternalLink, FiClock, FiUser, FiShoppingBag
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { adminService } from '../api/admin.service';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

export default function BlogModeration() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    isFeatured: '',
    reported: 'false',
    search: ''
  });
  const [activeTab, setActiveTab] = useState<'articles' | 'reports'>('articles');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showModModal, setShowModModal] = useState(false);
  const [modReason, setModReason] = useState('');
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'articles') {
        const res = await adminService.getBlogs(filters);
        setBlogs(res.data.blogs);
      } else {
        const res = await adminService.getBlogReports({});
        setReports(res.data.reports);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch journal data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModerate = async () => {
    if (!modReason) return toast.error('Moderation reason is required');
    
    try {
      await adminService.moderateBlog(selectedItem._id, {
        status: newStatus || selectedItem.status,
        reason: modReason
      });
      toast.success('Journal article moderated successfully');
      setShowModModal(false);
      setModReason('');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Moderation failed');
    }
  };

  const handleFeature = async (blog: any) => {
    try {
      await adminService.moderateBlog(blog._id, {
        isFeatured: !blog.isFeatured,
        reason: blog.isFeatured ? 'Editorial: Removing from featured list' : 'Editorial: Promoting to featured articles'
      });
      toast.success(blog.isFeatured ? 'Article removed from featured' : 'Article featured successfully');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  const handleResolveReport = async (reportId: string, status: 'resolved' | 'dismissed') => {
    const reason = window.prompt(`Enter resolution reason for ${status}:`);
    if (!reason) return;

    try {
      await adminService.resolveBlogReport(reportId, { status, reason });
      toast.success(`Report ${status}`);
      fetchData();
    } catch {
      toast.error('Failed to resolve report');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto pb-24">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0F0F0F] p-6 rounded-2xl border border-zinc-800/50 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
              <FiFileText className="text-white text-xl" />
            </div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Journal Moderation</h1>
          </div>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest pl-13">Platform Editorial & Governance Hub</p>
        </div>

        <div className="flex bg-black/40 p-1 rounded-xl border border-zinc-800/50">
          <button 
            onClick={() => setActiveTab('articles')}
            className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'articles' ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
          >
            Articles
          </button>
          <button 
            onClick={() => setActiveTab('reports')}
            className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'reports' ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
          >
            Community Flags
          </button>
        </div>
      </div>

      {activeTab === 'articles' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Filters Bar */}
          <div className="lg:col-span-4 flex flex-wrap items-center gap-3 bg-[#0A0A0A] p-4 rounded-xl border border-zinc-800/40">
            <div className="relative flex-1 min-w-[300px]">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input 
                type="text"
                placeholder="SEARCH BY ARTICLE TITLE..."
                className="w-full bg-black border border-zinc-800/50 rounded-xl py-3 pl-11 pr-4 text-[10px] font-bold text-white uppercase tracking-widest focus:border-white/50 transition-all outline-none"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            
            <select 
              className="bg-black border border-zinc-800/50 rounded-xl px-4 py-3 text-[10px] font-black text-white uppercase tracking-widest outline-none focus:border-white/50"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">ALL STATUSES</option>
              <option value="draft">DRAFT</option>
              <option value="published">PUBLISHED</option>
              <option value="removed">REMOVED</option>
            </select>

            <button 
              onClick={() => setFilters({ ...filters, reported: filters.reported === 'true' ? 'false' : 'true' })}
              className={`px-4 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${filters.reported === 'true' ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-black border-zinc-800/50 text-zinc-500 hover:text-white'}`}
            >
              <FiFlag />
              {filters.reported === 'true' ? 'SHOWING REPORTED' : 'FILTER REPORTED'}
            </button>
          </div>

          {/* Articles Table/Grid */}
          <div className="lg:col-span-4 overflow-x-auto rounded-2xl border border-zinc-800/40">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="bg-[#0F0F0F]">
                <tr>
                  <th className="px-6 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] border-b border-zinc-800/50">Article</th>
                  <th className="px-6 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] border-b border-zinc-800/50">Vendor / Author</th>
                  <th className="px-6 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] border-b border-zinc-800/50">Stats</th>
                  <th className="px-6 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] border-b border-zinc-800/50">Status</th>
                  <th className="px-6 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] border-b border-zinc-800/50 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-[#0A0A0A] divide-y divide-zinc-800/30">
                <AnimatePresence mode="popLayout">
                  {blogs.map((blog) => (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={blog._id} 
                      className="group hover:bg-[#0F0F0F] transition-all duration-300"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-zinc-900 overflow-hidden border border-zinc-800/50 relative">
                            {blog.coverImage ? (
                              <img src={blog.coverImage} className="w-full h-full object-cover" alt="" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-700">
                                <FiFileText size={20} />
                              </div>
                            )}
                            {blog.isFeatured && (
                              <div className="absolute top-0 right-0 p-1 bg-yellow-500 text-black rounded-bl-lg shadow-lg">
                                <FiStar size={10} />
                              </div>
                            )}
                          </div>
                          <div className="space-y-1 max-w-[300px]">
                            <h3 className="text-xs font-bold text-white uppercase tracking-tight truncate group-hover:text-blue-400 transition-colors uppercase">
                              {blog.title}
                            </h3>
                            <div className="flex items-center gap-2 text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                              <FiClock />
                              {format(new Date(blog.createdAt), 'MMM dd, yyyy')}
                              <span className="text-zinc-800">|</span>
                              <span>{blog.readingTime || 3} MINS</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-white uppercase">
                            <FiShoppingBag className="text-zinc-500" />
                            {blog.store?.name}
                          </div>
                          <div className="flex items-center gap-1.5 text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                            <FiUser size={12} />
                            {blog.author?.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-[10px] font-black text-white">{blog.views || 0}</p>
                            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-tighter">Views</p>
                          </div>
                          <div className="h-6 w-[1px] bg-zinc-800/50" />
                          <div className="text-center">
                            <p className="text-[10px] font-black text-white">{blog.likes || 0}</p>
                            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-tighter">Likes</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border shadow-sm ${
                          blog.status === 'published' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' :
                          blog.status === 'removed' ? 'bg-red-500/10 text-red-500 border-red-500/30' :
                          'bg-zinc-800/50 text-zinc-400 border-zinc-700/50'
                        }`}>
                          {blog.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleFeature(blog)}
                            className={`p-2 rounded-lg border transition-all ${blog.isFeatured ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' : 'bg-black border-zinc-800 hover:border-zinc-500 text-zinc-500'}`}
                            title={blog.isFeatured ? "Unfeature" : "Feature"}
                          >
                            <FiStar size={14} />
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedItem(blog);
                              setNewStatus('removed');
                              setShowModModal(true);
                            }}
                            className="p-2 bg-black border border-zinc-800 rounded-lg hover:border-red-500 hover:text-red-500 text-zinc-500 transition-all"
                            title="Remove Post"
                          >
                            <FiXCircle size={14} />
                          </button>
                          <a 
                            href={`https://shopvia.com/blog/${blog.slug}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 bg-black border border-zinc-800 rounded-lg hover:border-white hover:text-white text-zinc-500 transition-all"
                          >
                            <FiExternalLink size={14} />
                          </a>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
            
            {blogs.length === 0 && !isLoading && (
              <div className="py-24 text-center space-y-3">
                <FiFileText className="text-4xl text-zinc-800 mx-auto" />
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">No articles found matching filters</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report._id} className="bg-[#0F0F0F] border border-zinc-800/50 rounded-2xl p-6 hover:border-red-500/30 transition-all flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-red-500/10 p-2 rounded-lg">
                      <FiAlertTriangle className="text-red-500" />
                    </div>
                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Pending Report</span>
                  </div>
                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{format(new Date(report.createdAt), 'MMM dd, HH:mm')}</span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white uppercase tracking-tight">{report.blogId?.title}</h3>
                  <div className="flex items-center gap-2 text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                    <FiShoppingBag />
                    {report.blogId?.store?.name}
                    <span className="text-zinc-800">|</span>
                    <FiUser />
                    Reported by: {report.reportedBy?.name}
                  </div>
                </div>

                <div className="bg-black/40 p-4 rounded-xl border border-zinc-800/30">
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 opacity-50">Report Reason</p>
                  <p className="text-[11px] font-medium text-white italic">"{report.reason}"</p>
                </div>
              </div>

              <div className="flex md:flex-col justify-end gap-2 shrink-0 border-t md:border-t-0 md:border-l border-zinc-800/50 pt-4 md:pt-0 md:pl-6">
                <button 
                   onClick={() => handleResolveReport(report._id, 'resolved')}
                   className="flex-1 md:w-[140px] px-4 py-2.5 bg-red-500 text-black text-[10px] font-black uppercase tracking-widest rounded-lg hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                  Confirm & Moderate
                </button>
                <button 
                  onClick={() => handleResolveReport(report._id, 'dismissed')}
                  className="flex-1 md:w-[140px] px-4 py-2.5 bg-zinc-800 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-zinc-700 transition-all"
                >
                  Dismiss Report
                </button>
              </div>
            </div>
          ))}

          {reports.length === 0 && !isLoading && (
            <div className="py-32 text-center bg-[#0A0A0A] rounded-2xl border border-zinc-800/40">
              <FiCheckCircle className="text-emerald-500 text-4xl mb-4 mx-auto" />
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Moderation queue cleared. No pending reports.</p>
            </div>
          )}
        </div>
      )}

      {/* Moderation Modal */}
      <AnimatePresence>
        {showModModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg bg-[#0F0F0F] rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden p-8"
            >
              <div className="space-y-6">
                <div className="space-y-2 text-center">
                  <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto border border-red-500/20">
                    <FiAlertTriangle className="text-red-500 text-3xl" />
                  </div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tighter">Hardened Moderation Action</h2>
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Action will be immutably recorded in Admin Audit Logs</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Target Article</label>
                    <div className="bg-black border border-zinc-800/50 p-4 rounded-xl text-[11px] font-bold text-white uppercase">
                      {selectedItem?.title}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Justification Reason (Mandatory)</label>
                    <textarea 
                      className="w-full bg-black border border-zinc-800/50 rounded-xl p-4 text-xs text-white placeholder:text-zinc-700 focus:border-red-500/50 transition-all outline-none h-32"
                      placeholder="ENTER DETAILED REASON FOR MODERATION..."
                      value={modReason}
                      onChange={(e) => setModReason(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowModModal(false)}
                    className="flex-1 py-4 bg-zinc-900 text-zinc-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleModerate}
                    className="flex-1 py-4 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-[0_0_30px_rgba(220,38,38,0.2)] hover:scale-105 active:scale-95 transition-all"
                  >
                    Confirm Action
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
