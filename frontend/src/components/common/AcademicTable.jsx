/**
 * AcademicTable — Enterprise-grade data table for faculty gradebooks,
 * student rosters, and administrative ledgers.
 *
 * Specs (per FRONTEND_ACADEMIC_HANDOFF §4.1):
 *   - Sticky header row with dark text on slate-100 background
 *   - Fixed column widths to prevent layout jumps
 *   - Right-aligned numerical columns with monospaced tabular figures
 *   - Row hover state with hairline border dividers
 *   - 36–40px row height, zebra striping optional
 */

const AcademicTable = ({ columns, data, emptyIcon: EmptyIcon, emptyMessage = 'No records found' }) => {
  return (
    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-900 transition-colors">
      <table className="w-full text-left border-collapse text-xs">
        <thead className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-semibold uppercase tracking-wider">
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                scope="col"
                className={`px-4 py-2.5 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                style={{ width: col.width || 'auto' }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-slate-700 dark:text-slate-300">
          {data.map((row, rowIdx) => (
            <tr key={row._id || row.id || rowIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              {columns.map((col, colIdx) => (
                <td
                  key={colIdx}
                  className={`px-4 py-2 ${col.align === 'right' ? 'text-right font-mono tabular-nums' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                >
                  {col.render ? col.render(row) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {data.length === 0 && (
        <div className="text-center py-10">
          {EmptyIcon && <EmptyIcon className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />}
          <p className="text-sm text-slate-500 dark:text-slate-400">{emptyMessage}</p>
        </div>
      )}
    </div>
  );
};

export default AcademicTable;
