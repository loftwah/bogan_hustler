import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { takeLoan, payLoan } from "../store/playerSlice";
import type { RootState } from "../types";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHandHoldingUsd,
  faMoneyBillWave,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';

const LoanScreen = () => {
  const dispatch = useDispatch();
  const { cash, debt } = useSelector((state: RootState) => state.player);
  const [loanAmount, setLoanAmount] = useState(500);
  const [repayAmount, setRepayAmount] = useState(0);

  // Quick loan options
  const quickLoanOptions = [
    { amount: 500, label: "Quick $500" },
    { amount: 1000, label: "Quick $1k" },
    { amount: 5000, label: "Quick $5k" },
    { amount: 10000, label: "Quick $10k" },
  ];

  // Quick repay options - calculate based on current debt and cash
  const getQuickRepayOptions = () => {
    if (debt <= 0) return [];
    const maxRepay = Math.min(cash, debt);
    return [
      { amount: Math.min(maxRepay, Math.ceil(debt * 0.25)), label: "25%" },
      { amount: Math.min(maxRepay, Math.ceil(debt * 0.5)), label: "50%" },
      { amount: Math.min(maxRepay, Math.ceil(debt * 0.75)), label: "75%" },
      { amount: maxRepay, label: "Max" },
    ];
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="card">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">
            <FontAwesomeIcon icon={faHandHoldingUsd} className="mr-2" />
            Loan Shark
          </h2>
          <div className="flex gap-3 text-sm">
            <span className="px-3 py-1.5 bg-background/50 rounded-md">💰 ${cash.toLocaleString()}</span>
            <span className="px-3 py-1.5 bg-background/50 rounded-md">💸 ${debt.toLocaleString()}</span>
          </div>
        </div>

        {/* Loan Section */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="number"
              min="100"
              step="100"
              value={loanAmount}
              onChange={(e) => setLoanAmount(Math.max(100, parseInt(e.target.value) || 100))}
              className="w-full bg-background border-border rounded-md px-3 py-2"
              placeholder="Enter loan amount..."
            />
            <button 
              onClick={() => dispatch(takeLoan(loanAmount))}
              className="btn btn-primary whitespace-nowrap"
            >
              Take Loan
            </button>
          </div>

          {/* Quick Loan Options */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {quickLoanOptions.map((option) => (
              <button
                key={option.amount}
                onClick={() => {
                  setLoanAmount(option.amount);
                  dispatch(takeLoan(option.amount));
                }}
                className="btn btn-surface text-sm hover:bg-primary hover:text-white transition-colors"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Repay Section - Now always visible but disabled when debt is 0 */}
        <div className="mt-6 pt-6 border-t border-border space-y-4">
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              max={Math.min(cash, debt)}
              value={repayAmount}
              onChange={(e) => setRepayAmount(Math.min(cash, Math.max(0, parseInt(e.target.value) || 0)))}
              className="w-full bg-background border-border rounded-md px-3 py-2"
              placeholder="Enter repayment amount..."
              disabled={debt <= 0}
            />
            <button 
              onClick={() => {
                dispatch(payLoan(repayAmount));
                setRepayAmount(0);
              }}
              className="btn btn-primary whitespace-nowrap"
              disabled={debt <= 0 || repayAmount <= 0 || repayAmount > cash}
            >
              Repay
            </button>
          </div>

          {/* Quick Repay Options */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {getQuickRepayOptions().map((option) => (
              <button
                key={option.label}
                onClick={() => {
                  setRepayAmount(option.amount);
                  dispatch(payLoan(option.amount));
                }}
                disabled={debt <= 0 || option.amount > cash}
                className="btn btn-surface text-sm hover:bg-primary hover:text-white transition-colors disabled:opacity-50 disabled:hover:bg-surface disabled:hover:text-text"
              >
                Repay {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Warning Box */}
        <div className="mt-6 p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-lg">
          <div className="flex items-start gap-2">
            <FontAwesomeIcon icon={faExclamationTriangle} className="text-xl text-yellow-400" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-yellow-400">Warning: Unpaid debt accrues 5% interest daily!</p>
              <p className="text-xs text-yellow-400/80">The loan shark might take inventory as payment if you can't keep up.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanScreen; 