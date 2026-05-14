import { MessageCircle } from 'lucide-react';

const Comment = ({ comment }) => {
  const formatTime = (dateString) => {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffDays > 7) {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          ...(date.getFullYear() !== now.getFullYear() && { year: 'numeric' })
        });
      } else if (diffDays > 0) {
        return `${diffDays}d ago`;
      } else if (diffHours > 0) {
        return `${diffHours}h ago`;
      } else if (diffMins > 0) {
        return `${diffMins}m ago`;
      }
      return 'Just now';
    } catch (error) {
      return '';
    }
  };

  return (
    <div className="mt-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              {comment?.user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900 dark:text-white">
                  {comment?.user?.username || 'Unknown User'}
                </span>
                {comment?.user?.role === 'admin' && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400">
                    Admin
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {formatTime(comment?.createdAt)}
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-3">
          <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
            {comment?.content || ''}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Comment;
