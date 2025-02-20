import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { takeLoan, payLoan } from "../store/playerSlice";
import type { RootState } from "../types";

const LoanScreen = () => {
  const dispatch = useDispatch();
  const { cash, debt } = useSelector((state: RootState) => state.player);
  const [loanAmount, setLoanAmount] = useState(500);
  const [repayAmount, setRepayAmount] = useState(0);

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-4">Loan Shark</h2>
      <p className="mb-2">Debt: ${debt.toFixed(2)} (5% daily interest)</p>
      <p className="mb-4">Cash: ${cash}</p>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="loan-amount" className="block font-medium">Borrow:</label>
          <div className="flex gap-2">
            <input
              id="loan-amount"
              type="number"
              min="100"
              step="100"
              value={loanAmount}
              onChange={(e) => setLoanAmount(Math.max(100, parseInt(e.target.value) || 100))}
              className="w-full"
            />
            <button 
              onClick={() => dispatch(takeLoan(loanAmount))}
              className="btn btn-primary whitespace-nowrap"
            >
              Take Loan
            </button>
          </div>
        </div>

        {debt > 0 && (
          <div className="space-y-2">
            <label htmlFor="repay-amount" className="block font-medium">Repay:</label>
            <div className="flex gap-2">
              <input
                id="repay-amount"
                type="number"
                min="0"
                max={Math.min(cash, debt)}
                value={repayAmount}
                onChange={(e) => setRepayAmount(Math.min(cash, Math.max(0, parseInt(e.target.value) || 0)))}
                className="w-full"
              />
              <button 
                onClick={() => {
                  dispatch(payLoan(repayAmount));
                  setRepayAmount(0);
                }}
                className="btn btn-primary whitespace-nowrap"
                disabled={repayAmount <= 0 || repayAmount > cash}
              >
                Repay
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 text-yellow-400 space-y-1">
        <p>⚠️ Warning: Unpaid debt accrues 5% interest daily!</p>
        <p>The loan shark might take inventory as payment if you can't keep up.</p>
      </div>
    </div>
  );
};

export default LoanScreen; 