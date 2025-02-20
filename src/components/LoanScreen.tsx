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
    <div className="loan-screen">
      <h2>Loan Shark</h2>
      <p>Debt: ${debt.toFixed(2)} (5% daily interest)</p>
      <p>Cash: ${cash}</p>
      <div className="loan-controls">
        <div className="loan-action">
          <label htmlFor="loan-amount">Borrow: </label>
          <input
            id="loan-amount"
            type="number"
            min="100"
            step="100"
            value={loanAmount}
            onChange={(e) => setLoanAmount(Math.max(100, parseInt(e.target.value) || 100))}
          />
          <button 
            onClick={() => dispatch(takeLoan(loanAmount))}
            className="quick-action-button"
            aria-label={`Take loan of $${loanAmount}`}
          >
            Take Loan
          </button>
        </div>
        {debt > 0 && (
          <div className="loan-action">
            <label htmlFor="repay-amount">Repay: </label>
            <input
              id="repay-amount"
              type="number"
              min="0"
              max={Math.min(cash, debt)}
              value={repayAmount}
              onChange={(e) => setRepayAmount(Math.min(cash, Math.max(0, parseInt(e.target.value) || 0)))}
            />
            <button 
              onClick={() => {
                dispatch(payLoan(repayAmount));
                setRepayAmount(0);
              }}
              className="quick-action-button"
              disabled={repayAmount <= 0 || repayAmount > cash}
              aria-label={`Repay $${repayAmount} of loan`}
            >
              Repay
            </button>
          </div>
        )}
      </div>
      <div className="loan-warning">
        <p>⚠️ Warning: Unpaid debt accrues 5% interest daily!</p>
        <p>The loan shark might take inventory as payment if you can't keep up.</p>
      </div>
    </div>
  );
};

export default LoanScreen; 