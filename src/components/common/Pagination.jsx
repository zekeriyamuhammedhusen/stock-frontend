import React from 'react';

function Pagination({ page, totalPages, onPageChange, label = 'items' }) {
  if (!totalPages || totalPages <= 1) {
    return null;
  }

  const pages = [];
  const startPage = Math.max(1, page - 2);
  const endPage = Math.min(totalPages, startPage + 4);

  for (let currentPage = startPage; currentPage <= endPage; currentPage += 1) {
    pages.push(currentPage);
  }

  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-gray-600">
        Page {page} of {totalPages}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded border px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        {pages.map((currentPage) => (
          <button
            key={currentPage}
            type="button"
            onClick={() => onPageChange(currentPage)}
            className={
              currentPage === page
                ? 'rounded border border-blue-600 bg-blue-600 px-3 py-1 text-sm text-white'
                : 'rounded border px-3 py-1 text-sm'
            }
          >
            {currentPage}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded border px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Pagination;