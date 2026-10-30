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
  const [moderating, setModerating] = useState(false);
  const [featuringId, setFeaturingId] = useState<string | null>(null);

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
    if (moderating) return;

    setModerating(true);
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
    } finally {
      setModerating(false);
    }
  };

  const handleFeature = async (blog: any) => {
    if (featuringId) return;
    setFeaturingId(blog._id);
    try {
      await adminService.moderateBlog(blog._id, {
        isFeatured: !blog.isFeatured,
        reason: blog.isFeatured ? 'Editorial: Removing from featured list' : 'Editorial: Promoting to featured articles'
      });
      toast.success(blog.isFeatured ? 'Article removed from featured' : 'Article featured successfully');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Action failed');
    } finally {
      setFeaturingId(null);
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
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-sv-surface p-6 rounded-2xl border border-sv-border shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sv-surface-muted rounded-xl flex items-center justify-center border border-sv-border">
              <FiFileText className="text-sv-text-primary text-xl" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-sv-text-primary uppercase tracking-tight">Journal Moderation</h1>
          </div>
          <p className="text-sv-text-muted text-xs font-bold uppercase tracking-widest pl-13">Platform Editorial & Governance Hub</p>
        </div>

        <div className="flex bg-sv-surface-muted p-1 rounded-xl border border-sv-border">
          <button 
            onClick={() => setActiveTab('articles')}
            className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'articles' ? 'bg-sv-primary text-sv-text-inverse shadow-sm' : 'text-sv-text-muted hover:text-sv-text-primary'}`}
          >
            Articles
          </button>
          <button 
            onClick={() => setActiveTab('reports')}
            className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'reports' ? 'bg-sv-primary text-sv-text-inverse shadow-sm' : 'text-sv-text-muted hover:text-sv-text-primary'}`}
          >
            Community Flags
          </button>
        </div>
      </div>

      {activeTab === 'articles' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Filters Bar */}
          <div className="lg:col-span-4 flex flex-wrap items-center gap-3 bg-sv-surface p-4 rounded-xl border border-sv-border">
            <div className="relative flex-1 min-w-[260px]">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-sv-text-muted" />
              <input 
                type="text"
                placeholder="SEARCH BY ARTICLE TITLE..."
                className="w-full bg-sv-surface-muted border border-sv-border rounded-xl py-2.5 pl-11 pr-4 text-[10px] font-bold text-sv-text-primary uppercase tracking-widest focus:border-sv-primary transition-all outline-none"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            
            <select 
              className="w-full sm:w-auto bg-sv-surface-muted border border-sv-border rounded-xl px-4 py-2.5 text-[10px] font-black text-sv-text-secondary uppercase tracking-widest outline-none focus:border-sv-primary cursor-pointer"
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
              className={`w-full sm:w-auto px-4 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${filters.reported === 'true' ? 'bg-sv-danger-soft border-sv-danger/30 text-sv-danger' : 'bg-sv-surface-muted border-sv-border text-sv-text-muted hover:text-sv-text-primary'}`}
            >
              <FiFlag />
              {filters.reported === 'true' ? 'SHOWING REPORTED' : 'FILTER REPORTED'}
            </button>
          </div>

          {/* Articles Table/Grid */}
          <div className="lg:col-span-4 bg-sv-surface rounded-2xl border border-sv-border overflow-hidden shadow-sm">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-sv-border">
              <table className="w-full text-left border-collapse min-w-[750px]">
                <thead className="bg-sv-surface-muted/50 border-b border-sv-border">
                  <tr>
                    <th className="px-6 py-4 text-[9px] font-black text-sv-text-muted uppercase tracking-[0.2em]">Article</th>
                    <th className="px-6 py-4 text-[9px] font-black text-sv-text-muted uppercase tracking-[0.2em]">Vendor / Author</th>
                    <th className="px-6 py-4 text-[9px] font-black text-sv-text-muted uppercase tracking-[0.2em]">Stats</th>
                    <th className="px-6 py-4 text-[9px] font-black text-sv-text-muted uppercase tracking-[0.2em]">Status</th>
                    <th className="px-6 py-4 text-[9px] font-black text-sv-text-muted uppercase tracking-[0.2em] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sv-border">
                  <AnimatePresence mode="popLayout">
                    {blogs.map((blog) => (
                      <motion.tr 
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        key={blog._id} 
                        className="group hover:bg-sv-surface-muted/60 transition-all duration-300"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-sv-surface-muted overflow-hidden border border-sv-border relative shrink-0">
                              {blog.coverImage ? (
                                <img src={blog.coverImage} className="w-full h-full object-cover" alt="" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-sv-text-muted">
                                  <FiFileText size={20} />
                                </div>
                              )}
                              {blog.isFeatured && (
                                <div className="absolute top-0 right-0 p-1 bg-sv-warning text-sv-text-inverse rounded-bl-lg shadow-sm">
                                  <FiStar size={10} />
                                </div>
                              )}
                            </div>
                            <div className="space-y-1 max-w-[300px]">
                              <h3 className="text-xs font-bold text-sv-text-primary uppercase tracking-tight truncate group-hover:text-sv-primary transition-colors">
                                {blog.title}
                              </h3>
                              <div className="flex items-center gap-2 text-[9px] font-black text-sv-text-muted uppercase tracking-widest">
                                <FiClock />
                                {format(new Date(blog.createdAt), 'MMM dd, yyyy')}
                                <span className="text-sv-border">|</span>
                                <span>{blog.readingTime || 3} MINS</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-sv-text-primary uppercase">
                              <FiShoppingBag className="text-sv-text-muted" />
                              {blog.store?.name}
                            </div>
                            <div className="flex items-center gap-1.5 text-[9px] font-black text-sv-text-muted uppercase tracking-widest">
                              <FiUser size={12} />
                              {blog.author?.name}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <p className="text-[10px] font-black text-sv-text-primary">{blog.views || 0}</p>
                              <p className="text-[8px] font-black text-sv-text-muted uppercase tracking-tighter">Views</p>
                            </div>
                            <div className="h-6 w-[1px] bg-sv-border" />
                            <div className="text-center">
                              <p className="text-[10px] font-black text-sv-text-primary">{blog.likes || 0}</p>
                              <p className="text-[8px] font-black text-sv-text-muted uppercase tracking-tighter">Likes</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border shadow-sm ${
                            blog.status === 'published' ? 'bg-sv-success-soft text-sv-success border-sv-success/30' :
                            blog.status === 'removed' ? 'bg-sv-danger-soft text-sv-danger border-sv-danger/30' :
                            'bg-sv-surface-muted text-sv-text-secondary border-sv-border'
                          }`}>
                            {blog.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleFeature(blog)}
                              disabled={!!featuringId}
                              className={`p-2 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${blog.isFeatured ? 'bg-sv-warning-soft border-sv-warning/30 text-sv-warning' : 'bg-sv-surface-muted border-sv-border hover:border-sv-primary text-sv-text-muted hover:text-sv-text-primary'}`}
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
                              className="p-2 bg-sv-surface-muted border border-sv-border rounded-lg hover:border-sv-danger hover:text-sv-danger text-sv-text-muted transition-all"
                              title="Remove Post"
                            >
                              <FiXCircle size={14} />
                            </button>
                            <a 
                              href={`${import.meta.env.VITE_STOREFRONT_URL || 'https://shopvia.ng'}/blog/${blog.slug}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-2 bg-sv-surface-muted border border-sv-border rounded-lg hover:border-sv-primary hover:text-sv-primary text-sv-text-muted transition-all"
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
                  <FiFileText className="text-4xl text-sv-text-muted mx-auto" />
                  <p className="text-[10px] font-black text-sv-text-muted uppercase tracking-widest">No articles found matching filters</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report._id} className="bg-sv-surface border border-sv-border rounded-2xl p-6 shadow-sm hover:border-sv-danger/30 transition-all flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-sv-danger-soft p-2 rounded-lg border border-sv-danger/20">
                      <FiAlertTriangle className="text-sv-danger" />
                    </div>
                    <span className="text-[10px] font-black text-sv-danger uppercase tracking-widest">Pending Report</span>
                  </div>
                  <span className="text-[9px] font-black text-sv-text-muted uppercase tracking-widest">{format(new Date(report.createdAt), 'MMM dd, HH:mm')}</span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-sv-text-primary uppercase tracking-tight">{report.blogId?.title}</h3>
                  <div className="flex items-center gap-2 text-[9px] font-black text-sv-text-muted uppercase tracking-widest">
                    <FiShoppingBag />
                    {report.blogId?.store?.name}
                    <span className="text-sv-border">|</span>
                    <FiUser />
                    Reported by: {report.reportedBy?.name}
                  </div>
                </div>

                <div className="bg-sv-surface-muted p-4 rounded-xl border border-sv-border">
                  <p className="text-[9px] font-black text-sv-text-muted uppercase tracking-widest mb-1.5 opacity-70">Report Reason</p>
                  <p className="text-[11px] font-medium text-sv-text-primary italic">"{report.reason}"</p>
                </div>
              </div>

              <div className="flex md:flex-col justify-end gap-2 shrink-0 border-t md:border-t-0 md:border-l border-sv-border pt-4 md:pt-0 md:pl-6">
                <button 
                   onClick={() => handleResolveReport(report._id, 'resolved')}
                   className="flex-1 md:w-[140px] px-4 py-2.5 bg-sv-danger text-sv-text-inverse text-[10px] font-black uppercase tracking-widest rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  Confirm & Moderate
                </button>
                <button 
                  onClick={() => handleResolveReport(report._id, 'dismissed')}
                  className="flex-1 md:w-[140px] px-4 py-2.5 bg-sv-surface-muted text-sv-text-primary border border-sv-border text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-sv-surface transition-all"
                >
                  Dismiss Report
                </button>
              </div>
            </div>
          ))}

          {reports.length === 0 && !isLoading && (
            <div className="py-24 text-center bg-sv-surface rounded-2xl border border-sv-border shadow-sm">
              <FiCheckCircle className="text-sv-success text-4xl mb-4 mx-auto" />
              <p className="text-[10px] font-black text-sv-text-muted uppercase tracking-widest">Moderation queue cleared. No pending reports.</p>
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
              className="absolute inset-0 bg-sv-bg/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-sv-surface rounded-2xl border border-sv-border shadow-2xl overflow-y-auto max-h-[90vh] p-6 sm:p-8"
            >
              <div className="space-y-6">
                <div className="space-y-2 text-center">
                  <div className="w-16 h-16 bg-sv-danger-soft rounded-2xl flex items-center justify-center mx-auto border border-sv-danger/30">
                    <FiAlertTriangle className="text-sv-danger text-3xl" />
                  </div>
                  <h2 className="text-xl font-black text-sv-text-primary uppercase tracking-tight">Hardened Moderation Action</h2>
                  <p className="text-sv-text-muted text-[10px] font-black uppercase tracking-[0.2em]">Action will be immutably recorded in Admin Audit Logs</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-sv-text-muted uppercase tracking-[0.2em] ml-1">Target Article</label>
                    <div className="bg-sv-surface-muted border border-sv-border p-4 rounded-xl text-[11px] font-bold text-sv-text-primary uppercase">
                      {selectedItem?.title}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-sv-text-muted uppercase tracking-[0.2em] ml-1">Justification Reason (Mandatory)</label>
                    <textarea
                      className="w-full bg-sv-surface-muted border border-sv-border rounded-xl p-4 text-xs text-sv-text-primary placeholder:text-sv-text-muted focus:border-sv-primary transition-all outline-none h-32"
                      placeholder="ENTER DETAILED REASON FOR MODERATION..."
                      value={modReason}
                      onChange={(e) => setModReason(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowModModal(false)}
                    className="flex-1 py-3 bg-sv-surface-muted text-sv-text-muted border border-sv-border text-[10px] font-black uppercase tracking-widest rounded-xl hover:text-sv-text-primary transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleModerate}
                    disabled={moderating}
                    className="flex-1 py-3 bg-sv-danger text-sv-text-inverse text-[10px] font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {moderating ? 'Processing...' : 'Confirm Action'}
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
