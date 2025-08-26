import React from 'react';
import { Users, FileText, CheckSquare, DollarSign } from 'lucide-react';
import { useCustomers } from '../../hooks/useCustomers';
import { useLeads } from '../../hooks/useLeads';
import { useQuotes } from '../../hooks/useQuotes';
import { useTasks } from '../../hooks/useTasks';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  change: string;
  trend: 'up' | 'down';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, change, trend }) => (
  <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        <p className={`text-sm mt-1 ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
          {change} from last month
        </p>
      </div>
      <div className="p-3 bg-[#F1F3F4] rounded-full">
        {icon}
      </div>
    </div>
  </div>
);

export const DashboardStats: React.FC = () => {
  const { customers, loading: customersLoading } = useCustomers();
  const { leads, loading: leadsLoading } = useLeads();
  const { quotes, loading: quotesLoading } = useQuotes();
  const { tasks, loading: tasksLoading } = useTasks();

  // Calculate real stats
  const totalCustomers = customers.length + leads.length;
  const activeQuotes = quotes.filter(quote => quote.status === 'sent' || quote.status === 'draft').length;
  const pendingTasks = tasks.filter(task => task.status === 'pending').length;
  
  // Calculate revenue from approved quotes
  const monthlyRevenue = quotes
    .filter(quote => {
      if (quote.status !== 'approved') return false;
      const quoteDate = new Date(quote.createdAt);
      const now = new Date();
      return quoteDate.getMonth() === now.getMonth() && quoteDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, quote) => sum + quote.totalEstimatedCost, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const isLoading = customersLoading || leadsLoading || quotesLoading || tasksLoading;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="p-3 bg-gray-200 rounded-full w-12 h-12"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Customers & Leads"
        value={totalCustomers.toString()}
        icon={<Users className="h-6 w-6 text-brand" />}
        change="Real-time"
        trend="up"
      />
      <StatCard
        title="Active Quotes"
        value={activeQuotes.toString()}
        icon={<FileText className="h-6 w-6 text-[#34A853]" />}
        change="Draft & Sent"
        trend="up"
      />
      <StatCard
        title="Pending Tasks"
        value={pendingTasks.toString()}
        icon={<CheckSquare className="h-6 w-6 text-[#FBBC05]" />}
        change="Awaiting action"
        trend={pendingTasks > 0 ? "down" : "up"}
      />
      <StatCard
        title="Revenue (MTD)"
        value={formatCurrency(monthlyRevenue)}
        icon={<DollarSign className="h-6 w-6 text-[#34A853]" />}
        change="Approved quotes"
        trend="up"
      />
    </div>
  );
};