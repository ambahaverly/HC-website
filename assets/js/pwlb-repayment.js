// PWLB early repayment premium / discount calculator
// Method ported unchanged from the original Haverly Consulting tool.
(function () {
  function $(id) { return document.getElementById(id); }
  function daysBetween(d1, d2) { return Math.round((d2 - d1) / 86400000); }
  function fmt(v) {
    var sign = v < 0 ? '-' : '';
    return sign + '£' + Math.abs(v).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function fmtPct(v) { return (v * 100).toFixed(6) + '%'; }
  function showError(msg) { var el = $('errorMsg'); el.textContent = msg; el.hidden = false; }

  function calculate() {
    $('errorMsg').hidden = true;
    var loanType = $('loanType').value;
    var repaid = new Date($('loanRepaidDate').value);
    var finalPay = new Date($('finalPaymentDate').value);
    var prevInt = new Date($('prevInterestDate').value);
    var amount = parseFloat($('amount').value);
    var discPct = parseFloat($('discountRate').value);
    var loanPct = parseFloat($('loanRate').value);

    if ([repaid, finalPay, prevInt].some(function (d) { return isNaN(d); })) return showError('Please enter valid dates for all date fields.');
    if (isNaN(amount) || amount <= 0) return showError('Please enter a valid positive amount.');
    if (isNaN(discPct) || isNaN(loanPct)) return showError('Please enter valid rates.');
    if (finalPay <= repaid) return showError('Date of final payment must be after the repayment date.');

    var id = discPct / 200;
    var il = loanPct / 200;
    var D = daysBetween(prevInt, repaid);
    var N = Math.round(((finalPay - repaid) / (365 * 86400000)) * 2);
    if (N <= 0) return showError('Number of semi-annual periods (N) must be positive. Check your dates.');

    var A1 = id / (1 - Math.pow(1 + id, -N));
    var PV1 = Math.pow(1 + id, -N);
    var A2 = il / (1 - Math.pow(1 + il, -N));

    // Maturity
    var premMaturity = amount * ((1 + (id * D) / 182.5) * ((il / A1) + PV1) - (1 + (il * 20) / 182.5));
    // EIP
    var premEIP = amount * ((1 + (id * D) / 182.5) * ((1 / (N * A1)) * (1 - il / id) + il / id) - (1 + (il * D) / 182.5));
    // Annuity
    var premAnnuity = amount * ((1 + (id * D) / 182.5) * (A2 / A1) - (1 + (il * D) / 182.5));

    var results = { Maturity: premMaturity, EIP: premEIP, Annuity: premAnnuity };
    var active = results[loanType];
    var isDiscount = active < 0;
    $('resultLabel').textContent = isDiscount ? 'Discount receivable' : 'Premium payable';
    $('resultValue').textContent = fmt(active);
    $('resultValue').className = 'value' + (isDiscount ? ' discount' : '');

    $('bId').textContent = fmtPct(id);
    $('bIl').textContent = fmtPct(il);
    $('bD').textContent = D + ' days';
    $('bN').textContent = N + ' periods';
    $('bA1').textContent = A1.toFixed(8);
    $('bPV1').textContent = PV1.toFixed(8);
    $('bA2').textContent = A2.toFixed(8);
    ['Maturity', 'EIP', 'Annuity'].forEach(function (m) {
      $('val' + m).textContent = fmt(results[m]);
      $('row' + m).classList.toggle('active', m === loanType);
    });
  }

  $('calcForm').addEventListener('submit', function (e) { e.preventDefault(); calculate(); });
  $('loanType').addEventListener('change', calculate);
  calculate();
})();
