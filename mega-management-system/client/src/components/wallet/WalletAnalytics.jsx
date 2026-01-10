import React from 'react';
import { TrendingUp, TrendingDown, Users, Wallet, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function WalletAnalytics({ analytics, loading }) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl p-5 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
                        <div className="h-8 bg-gray-200 rounded w-32"></div>
                    </div>
                ))}
            </div>
        );
    }

    const stats = [
        {
            title: 'Total Distributed',
            value: analytics?.totalDistributed || 0,
            icon: TrendingUp,
            iconBg: 'from-green-400 to-emerald-500',
            textColor: 'text-green-600',
            bgGradient: 'from-green-50 to-emerald-50',
            borderColor: 'border-green-200',
            prefix: '₹'
        },
        {
            title: 'Total Spent',
            value: analytics?.totalSpent || 0,
            icon: TrendingDown,
            iconBg: 'from-red-400 to-rose-500',
            textColor: 'text-red-600',
            bgGradient: 'from-red-50 to-rose-50',
            borderColor: 'border-red-200',
            prefix: '₹'
        },
        {
            title: 'Current Balance',
            value: analytics?.totalBalance || 0,
            icon: Wallet,
            iconBg: 'from-blue-400 to-indigo-500',
            textColor: 'text-blue-600',
            bgGradient: 'from-blue-50 to-indigo-50',
            borderColor: 'border-blue-200',
            prefix: '₹'
        },
        {
            title: 'Active Wallets',
            value: `${analytics?.activeWallets || 0}/${analytics?.totalEmployees || 0}`,
            icon: Users,
            iconBg: 'from-purple-400 to-violet-500',
            textColor: 'text-purple-600',
            bgGradient: 'from-purple-50 to-violet-50',
            borderColor: 'border-purple-200',
            prefix: '',
            isCount: true
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                    <div
                        key={index}
                        className={`relative overflow-hidden bg-gradient-to-br ${stat.bgGradient} rounded-xl p-5 border ${stat.borderColor} shadow-sm hover:shadow-md transition-all duration-300 group`}
                    >
                        {/* Background decoration */}
                        <div className="absolute top-0 right-0 w-24 h-24 transform translate-x-8 -translate-y-8">
                            <div className={`w-full h-full rounded-full bg-gradient-to-br ${stat.iconBg} opacity-10 group-hover:opacity-20 transition-opacity`}></div>
                        </div>

                        <div className="relative">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium text-gray-600">{stat.title}</span>
                                <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.iconBg} shadow-lg`}>
                                    <Icon className="w-4 h-4 text-white" />
                                </div>
                            </div>

                            <div className={`text-2xl font-bold ${stat.textColor}`}>
                                {stat.isCount ? stat.value : (
                                    <>
                                        {stat.prefix}{typeof stat.value === 'number' ? stat.value.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : stat.value}
                                    </>
                                )}
                            </div>

                            {!stat.isCount && (
                                <div className="flex items-center mt-2 text-xs text-gray-500">
                                    {stat.title === 'Total Distributed' && (
                                        <>
                                            <ArrowUpRight className="w-3 h-3 text-green-500 mr-1" />
                                            <span>{analytics?.creditCount || 0} transactions</span>
                                        </>
                                    )}
                                    {stat.title === 'Total Spent' && (
                                        <>
                                            <ArrowDownRight className="w-3 h-3 text-red-500 mr-1" />
                                            <span>{analytics?.debitCount || 0} expenses</span>
                                        </>
                                    )}
                                    {stat.title === 'Current Balance' && (
                                        <>
                                            <DollarSign className="w-3 h-3 text-blue-500 mr-1" />
                                            <span>Avg: ₹{(analytics?.avgBalance || 0).toFixed(0)}/employee</span>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
