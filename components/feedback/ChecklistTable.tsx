"use client";

import { ScorecardItem } from "@/lib/types";

export function ChecklistTable({
  items,
  title,
}: {
  items: ScorecardItem[];
  title: string;
}) {
  return (
    <div>
      <h4 className="text-sm font-semibold mb-2">{title}</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 pr-4 font-medium text-gray-500 dark:text-gray-400">
                Item
              </th>
              <th className="text-center py-2 px-2 font-medium text-gray-500 dark:text-gray-400 w-16">
                Status
              </th>
              <th className="text-left py-2 pl-4 font-medium text-gray-500 dark:text-gray-400">
                Comment
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr
                key={i}
                className="border-b border-gray-100 dark:border-gray-800 last:border-0"
              >
                <td className="py-2 pr-4">{item.item}</td>
                <td className="py-2 px-2 text-center">
                  {item.achieved ? (
                    <span className="text-green-600 dark:text-green-400 font-bold">
                      &#10003;
                    </span>
                  ) : (
                    <span className="text-red-600 dark:text-red-400 font-bold">
                      &#10007;
                    </span>
                  )}
                </td>
                <td
                  className={`py-2 pl-4 text-xs ${
                    item.achieved
                      ? "text-green-700 dark:text-green-400"
                      : "text-red-700 dark:text-red-400"
                  }`}
                >
                  {item.comment}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
