import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { takeLoan, repayLoan } from "../store/playerSlice";
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
          <label>Borrow: </label>
          <input
            type="number"
            min="100"
            step="100"
            value={loanAmount}
            onChange={(e) => setLoanAmount(Math.max(100, parseInt(e.target.value) || 100))}
          />
          <button 
            onClick={() => dispatch(takeLoan(loanAmount))}
            className="loan-button"
          >
            Take Loan
          </button>
        </div>
        {debt > 0 && (
          <div className="loan-action">
            <label>Repay: </label>
            <input
              type="number"
              min="0"
              max={Math.min(cash, debt)}
              value={repayAmount}
              onChange={(e) => setRepayAmount(Math.min(cash, Math.max(0, parseInt(e.target.value) || 0)))}
            />
            <button 
              onClick={() => {
                dispatch(repayLoan(repayAmount));
                setRepayAmount(0);
              }}
              className="loan-button"
              disabled={repayAmount <= 0 || repayAmount > cash}
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