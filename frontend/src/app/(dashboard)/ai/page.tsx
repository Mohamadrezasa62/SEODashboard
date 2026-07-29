'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Brain, Plus, Star, Trash2, Key,
  Loader2, Sparkles, BarChart3,
  CheckCircle, XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { AddProviderDialog } from '@/components/ai/AddProviderDialog'
import { aiApi, type AIProvider, type AIUsageStats } from '@/lib/api/ai'
import { projectsApi } from '@/lib/api/projects'
import { QUERY_KEYS } from '@/lib/constants'
import { formatNumber, cn } from '@/lib/utils'
import { useAuth } from '@/lib/hooks/useAuth'
import toast from 'react-hot-toast'

const PROVIDER_COLORS: Record<string, string> = {
  openai: 'text-green-500 bg-green-500/10',
  anthropic: 'text-orange-500 bg-orange-500/10',
  gemini: 'text-blue-500 bg-blue-500/10',
}

const PROVIDER_LABELS: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  gemini: 'Google Gemini',
}

export default function AIPage() {
  const { isDeveloper } = useAuth()
  const queryClient = useQueryClient()
  const [addProviderOpen, setAddProviderOpen] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [keyword, setKeyword] = useState('')
  const [context, setContext] = useState('')
  const [suggestion, setSuggestion] = useState('')

  const { data: providersData, isLoading: providersLoading } = useQuery({
    queryKey: ['ai-providers'],
    queryFn: aiApi.listProviders,
  })

  const { data: projectsData } = useQuery({
    queryKey: QUERY_KEYS.PROJECTS,
    queryFn: () => projectsApi.list(),
  })

  const { data: statsData } = useQuery({
    queryKey: ['ai-usage'],
    queryFn: () => aiApi.getUsageStats(),
  })

  const setDefaultMutation = useMutation({
    mutationFn: aiApi.setDefault,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-providers'] })
      toast.success('پرووایدر پیش‌فرض تغییر یافت')
    },
  })

  const deleteProviderMutation = useMutation({
    mutationFn: aiApi.deleteProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-providers'] })
      toast.success('پرووایدر حذف شد')
    },
  })

  const toggleProviderMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      aiApi.updateProvider(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-providers'] })
    },
  })

  const suggestionMutation = useMutation({
    mutationFn: () => aiApi.getSuggestion(selectedProjectId, keyword, context),
    onSuccess: (res) => setSuggestion(res.data.suggestion),
    onError: () => toast.error('خطا در دریافت پیشنهاد'),
  })

  const providers = providersData?.data ?? []
  const projects = projectsData?.data ?? []
  const stats = statsData?.data as AIUsageStats | null

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">هوش مصنوعی</h1>
          <p className="text-muted-foreground text-sm mt-1">تنظیمات و استفاده از AI</p>
        </div>
        {isDeveloper && (
          <Button onClick={() => setAddProviderOpen(true)}>
            <Plus className="w-4 h-4 ml-2" />
            پرووایدر جدید
          </Button>
        )}
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">کل درخواست‌ها</p>
              <p className="text-2xl font-bold">{formatNumber(stats.total_requests)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">کل توکن‌ها</p>
              <p className="text-2xl font-bold">{formatNumber(stats.total_tokens)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">موفق</p>
              <p className="text-2xl font-bold text-green-500">{formatNumber(stats.successful)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">میانگین زمان (ms)</p>
              <p className="text-2xl font-bold">
                {stats.avg_response_time ? Math.round(stats.avg_response_time) : '—'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="suggest">
        <TabsList>
          <TabsTrigger value="suggest">
            <Sparkles className="w-4 h-4 ml-2" />
            پیشنهاد SEO
          </TabsTrigger>
          {isDeveloper && (
            <TabsTrigger value="providers">
              <Key className="w-4 h-4 ml-2" />
              پرووایدرها ({providers.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="suggest" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="w-4 h-4" />
                پیشنهاد بهینه‌سازی SEO
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>پروژه</Label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger className="w-52">
                    <SelectValue placeholder="انتخاب پروژه" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>کلیدواژه</Label>
                <Input
                  placeholder="مثال: خرید کفش ورزشی"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>اطلاعات اضافه (اختیاری)</Label>
                <Textarea
                  placeholder="هر اطلاعات بیشتری که می‌خواهید AI در نظر بگیرد..."
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              <Button
                onClick={() => suggestionMutation.mutate()}
                disabled={!selectedProjectId || !keyword.trim() || suggestionMutation.isPending}
              >
                {suggestionMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    در حال تولید...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 ml-2" />
                    دریافت پیشنهاد
                  </>
                )}
              </Button>

              {suggestion && (
                <div className="mt-4 p-4 bg-muted/40 rounded-xl border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="w-4 h-4 text-primary" />
                    <p className="text-sm font-medium">پیشنهاد AI</p>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{suggestion}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {isDeveloper && (
          <TabsContent value="providers" className="mt-4">
            {providersLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : providers.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Key className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-sm">هنوز پرووایدری اضافه نشده</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {providers.map((provider: AIProvider) => (
                  <Card key={provider.id} className={cn(
                    'transition-shadow',
                    provider.is_default && 'border-primary/30 bg-primary/5'
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          'p-2.5 rounded-lg',
                          PROVIDER_COLORS[provider.provider] || 'bg-muted text-muted-foreground'
                        )}>
                          <Brain className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm">{provider.name}</p>
                            {provider.is_default && (
                              <Badge variant="secondary" className="text-xs text-primary">
                                <Star className="w-3 h-3 ml-1 fill-current" />
                                پیش‌فرض
                              </Badge>
                            )}
                            <Badge
                              variant="secondary"
                              className={cn(
                                'text-xs',
                                provider.is_active ? 'text-green-500' : 'text-muted-foreground'
                              )}
                            >
                              {provider.is_active ? (
                                <><CheckCircle className="w-3 h-3 ml-1" />فعال</>
                              ) : (
                                <><XCircle className="w-3 h-3 ml-1" />غیرفعال</>
                              )}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {PROVIDER_LABELS[provider.provider]} — {provider.model}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {!provider.is_default && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8"
                              onClick={() => setDefaultMutation.mutate(provider.id)}
                            >
                              <Star className="w-3.5 h-3.5 ml-1" />
                              پیش‌فرض
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={() => toggleProviderMutation.mutate({
                              id: provider.id,
                              is_active: !provider.is_active,
                            })}
                          >
                            {provider.is_active ? 'غیرفعال' : 'فعال'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => {
                              if (confirm('حذف این پرووایدر؟')) {
                                deleteProviderMutation.mutate(provider.id)
                              }
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      <AddProviderDialog
        open={addProviderOpen}
        onClose={() => setAddProviderOpen(false)}
      />
    </div>
  )
}