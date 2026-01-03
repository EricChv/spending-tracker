/*
  ═══════════════════════════════════════════════════════════════════
  TRANSACTIONS PAGE - View and Manage All Transactions
  ═══════════════════════════════════════════════════════════════════
  
  This page allows users to:
  - View all their transactions (income and expenses)
  - Filter by type (all, income, expenses)
  - Search by description
  - Sort by date, amount, or description
  - See transaction details (date, description, amount, type)
  - Add new transactions
  - Delete existing transactions
  
  Data Flow:
  1. User must be logged in (checked via Supabase session)
  2. Page fetches all transactions from Supabase 'transactions' table
  3. User can filter, search, and sort the transaction list
  4. User can add new transactions via form
  5. Transaction list refreshes automatically after add/delete
  
  Database Table: transactions
  - Columns: id, user_id, amount, description, type, date, created_at
  - RLS Policy: Users can only see/modify their own transactions
*/

'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// ═══════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════

interface Transaction {
  id: string
  user_id: string
  account_id: string
  name: string
  amount: number
  date: string
  category: string | null
  bank_transaction_id: string
  created_at: string
}

// Helper to derive transaction type from amount
// Banking convention: positive amount = expense, negative = income/refund
const getTransactionType = (amount: number): 'income' | 'expense' => {
  return amount >= 0 ? 'expense' : 'income'
}

export default function TransactionsPage() {
  
  // ═══════════════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════
  
  const router = useRouter()
  
  // Authentication & Data Loading
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  
  // Filter & Search States
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'name'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // ═══════════════════════════════════════════════════════════════════
  // AUTHENTICATION CHECK
  // ═══════════════════════════════════════════════════════════════════
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
      } else {
        setUser({
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || 'user@example.com'
        })
        setLoading(false)
        fetchTransactions()
      }
    }
    
    checkAuth()
  }, [router])

  // ═══════════════════════════════════════════════════════════════════
  // FETCH TRANSACTIONS FROM DATABASE
  // ═══════════════════════════════════════════════════════════════════
  const fetchTransactions = async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) return

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', session.user.id)
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching transactions:', error)
      return
    }

    setTransactions(data || [])
  }

  // ═══════════════════════════════════════════════════════════════════
  // SYNC BANK TRANSACTIONS
  // ═══════════════════════════════════════════════════════════════════
  const [syncing, setSyncing] = useState(false)
  
  const handleSyncTransactions = async () => {
    setSyncing(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      setSyncing(false)
      return
    }

    try {
      // TODO: Implement Teller.io sync here
      // Example:
      // const response = await fetch('/api/teller/sync-transactions', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${session.access_token}`
      //   }
      // })

      alert('Sync functionality ready for Teller.io integration')
      // fetchTransactions()  // Uncomment after implementation
    } catch (error) {
      console.error('Error syncing transactions:', error)
      alert('Failed to sync transactions. Please try again.')
    }
    
    setSyncing(false)
  }

  // ═══════════════════════════════════════════════════════════════════
  // FILTER, SEARCH & SORT LOGIC
  // ═══════════════════════════════════════════════════════════════════
  const filteredAndSortedTransactions = transactions
    .filter(transaction => {
      // Filter by type (derived from amount)
      const txType = getTransactionType(transaction.amount)
      if (filterType !== 'all' && txType !== filterType) return false
      
      // Filter by search query
      if (searchQuery && !transaction.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      
      return true
    })
    .sort((a, b) => {
      let comparison = 0
      
      if (sortBy === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
      } else if (sortBy === 'amount') {
        comparison = Math.abs(a.amount) - Math.abs(b.amount)
      } else if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name)
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

  // Calculate totals for filtered transactions
  const totalIncome = filteredAndSortedTransactions
    .filter(t => getTransactionType(t.amount) === 'income')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  
  const totalExpenses = filteredAndSortedTransactions
    .filter(t => getTransactionType(t.amount) === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  // ═══════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════
  
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar user={user || undefined} />
      <SidebarInset>
        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* HEADER */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Transactions</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* MAIN CONTENT */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className="flex flex-1 flex-col gap-4 p-4">
          
          {/* Page Title & Sync Button */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Transactions</h1>
              <p className="text-muted-foreground">Transactions from your connected bank accounts</p>
            </div>
            <Button onClick={handleSyncTransactions} disabled={syncing}>
              {syncing ? 'Syncing...' : '🔄 Sync Transactions'}
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Income</CardDescription>
                <CardTitle className="text-3xl text-green-700">
                  ${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </CardTitle>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Expenses</CardDescription>
                <CardTitle className="text-3xl text-red-700">
                  ${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </CardTitle>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Net Balance</CardDescription>
                <CardTitle className={`text-3xl ${totalIncome - totalExpenses >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  ${(totalIncome - totalExpenses).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>



          {/* Filters & Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="grid gap-2">
                  <Label>Filter by Type</Label>
                  <Select value={filterType} onValueChange={(value: 'all' | 'income' | 'expense') => setFilterType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Transactions</SelectItem>
                      <SelectItem value="income">Income Only</SelectItem>
                      <SelectItem value="expense">Expenses Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Sort By</Label>
                  <Select value={sortBy} onValueChange={(value: 'date' | 'amount' | 'description') => setSortBy(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="amount">Amount</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Order</Label>
                  <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Newest First</SelectItem>
                      <SelectItem value="asc">Oldest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="search">Search</Label>
                  <Input
                    id="search"
                    type="text"
                    placeholder="Search descriptions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transactions List */}
          <Card>
            <CardHeader>
              <CardTitle>
                {filteredAndSortedTransactions.length} Transaction{filteredAndSortedTransactions.length !== 1 ? 's' : ''}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredAndSortedTransactions.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <p>No transactions found</p>
                  <p className="mt-2 text-sm">Try adjusting your filters or add a new transaction</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAndSortedTransactions.map((transaction) => {
                    const txType = getTransactionType(transaction.amount)
                    const displayAmount = Math.abs(transaction.amount)
                    
                    return (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`flex size-12 items-center justify-center rounded-full ${
                            txType === 'income' ? 'bg-green-500/10' : 'bg-red-500/10'
                          }`}>
                            <span className="text-xl">{transaction.name[0]?.toUpperCase() || '?'}</span>
                          </div>
                          <div>
                            <div className="font-medium">{transaction.name}</div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{new Date(transaction.date).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })}</span>
                              {transaction.category && (
                                <>
                                  <span>•</span>
                                  <span>{transaction.category}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className={`text-lg font-semibold ${
                          txType === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {txType === 'income' ? '+' : '-'}${displayAmount.toLocaleString('en-US', { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
