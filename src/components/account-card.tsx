import { Button } from "@/components/ui/button"

interface AccountCardProps {
  account: {
    id: string
    name: string
    type: string
    balance: number
    account_number_last_four?: string
    institution_name?: string
  }
  index: number
  onDelete?: (id: string) => void
  showDeleteButton?: boolean
}

export function AccountCard({ account, index, onDelete, showDeleteButton = false }: AccountCardProps) {
  // Muted vintage color palette for visual variety
  const colors = [
    '#99B898', // Muted Green
    '#FECEAB', // Light Peach/Orange
    '#FF847C', // Salmon/Coral Red
    '#E84A5F', // Deep Rosy Red
    '#D8C99B', // Muted Gold/Beige
    '#F6AA96', // Dusty Rose/Light Terracotta
    '#A7C4B7', // Sage Blue-Green
    '#C67554', // Warm Brown/Burnt Orange
  ]
  const bgColor = colors[index % colors.length]

  return (
    <div
      className="relative overflow-hidden rounded-md p-6 text-white aspect-[2/1] max-w-md"
      style={{ backgroundColor: bgColor }}
    >
      {/* Metallic sheen overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/20 pointer-events-none" />
      
      {/* Account Info Section */}
      <div className="relative mb-8">
        <div className="text-xs opacity-80">{account.type.replace('_', ' ')}</div>
        <div className="mt-1 text-base font-semibold">{account.name}</div>
        {account.account_number_last_four && (
          <div className="mt-1 font-mono text-sm tracking-wider">
            •••• {account.account_number_last_four}
          </div>
        )}
      </div>
      
      {/* Balance Display */}
      <div className="relative flex items-end justify-between">
        <div>
          <div className="text-xs opacity-80">Balance</div>
          <div className="text-2xl font-bold">
            ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        {account.institution_name && (
          <div className="rounded bg-white/20 px-1 py-1 font-bold uppercase tracking-wider relative mt-4 text-xs opacity-80">
            {account.institution_name}
          </div>
        )}
      </div>
      
      {/* Delete Button (optional) */}
      {showDeleteButton && onDelete && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(account.id)}
          className="absolute right-2 top-2 text-white hover:bg-white/20"
        >
          Delete
        </Button>
      )}
    </div>
  )
}
