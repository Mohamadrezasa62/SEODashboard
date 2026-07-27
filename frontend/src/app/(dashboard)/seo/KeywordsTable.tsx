'use client'

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'
import { ArrowUpDown, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { TopKeyword } from '@/types/seo'
import { formatNumber, formatCTR, formatPosition } from '@/lib/utils'

const columnHelper = createColumnHelper<TopKeyword>()

const columns = [
  columnHelper.accessor('keyword__keyword', {
    header: 'کلیدواژه',
    cell: (info) => (
      <span className="font-medium text-sm" dir="ltr">{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor('total_clicks', {
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="h-auto p-0 font-medium text-xs"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        کلیک <ArrowUpDown className="w-3 h-3 mr-1" />
      </Button>
    ),
    cell: (info) => <span className="text-sm">{formatNumber(info.getValue())}</span>,
  }),
  columnHelper.accessor('total_impressions', {
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="h-auto p-0 font-medium text-xs"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        نمایش <ArrowUpDown className="w-3 h-3 mr-1" />
      </Button>
    ),
    cell: (info) => <span className="text-sm">{formatNumber(info.getValue())}</span>,
  }),
  columnHelper.accessor('avg_ctr', {
    header: 'CTR',
    cell: (info) => <span className="text-sm">{formatCTR(info.getValue())}</span>,
  }),
  columnHelper.accessor('avg_position', {
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="h-auto p-0 font-medium text-xs"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        رتبه <ArrowUpDown className="w-3 h-3 mr-1" />
      </Button>
    ),
    cell: (info) => (
      <span className={`text-sm font-medium ${
        info.getValue() <= 3 ? 'text-green-500' :
        info.getValue() <= 10 ? 'text-yellow-500' : 'text-muted-foreground'
      }`}>
        {formatPosition(info.getValue())}
      </span>
    ),
  }),
]

interface Props {
  data: TopKeyword[]
  loading?: boolean
}

export function KeywordsTable({ data, loading }: Props) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'total_clicks', desc: true }])
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  if (loading) {
    return (
      <Card className="p-4 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </Card>
    )
  }

  return (
    <Card>
      <div className="p-4 border-b border-border">
        <div className="relative max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="جستجو در کلیدواژه‌ها..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pr-9"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="text-right px-4 py-3 text-xs font-medium text-muted-foreground"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {table.getRowModel().rows.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            کلیدواژه‌ای یافت نشد
          </div>
        )}
      </div>
    </Card>
  )
}