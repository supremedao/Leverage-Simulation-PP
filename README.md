# Leverage-Simulation-PP
 
The model is to simulate:
1. Depositing 1 wsteth to get crvusd on a given date
create_loan(date)

2. Swap crvusd to usdc 
usdc_amount = swapCrvUsdToUsdc(date, loan_amount)

3. Compute the health factor of that wsteth position
compute_health_factor_over_time(date, 1, usdc_amount)

4. Stake the usdc in the d2d/usdc pool on aura #quick timestamp to date conversion
stakeOnAura(timestamp, usdc_amount)

5. Simulate the impermanent health of that position
plot_impermanent_loss_with_cleaned_dates_v2(usdc_amount,timestamp)
IL_amount = calculate_impermanent_loss_v6(usdc_amount, EndDate)

6. Calculate aura rewards for that positon 
rewards_per_date(date)

7. Simulate reinvesting x amount of usd if health factor goes down 15%
simulate_reinvest(date, 1, 500)

8. Simulate reinvesting rewards up to the day if health factor goes down 15%
simulate_reinvestV2("2023-06-23", 1, usdc_amount,rewards)

9. Plot profitability of the wsteth position
plot_wsteth_profitability_usd2(startDate, EndDate)

10. Plot profitability of the wsteth position with rewards
plot_wsteth_profitability_usd_with_rewards(startDate, EndDate, rewards)

11. Plot profitability of the wsteth position with rewards minus impermanent loss
plot_wsteth_profitability_usd_with_rewards_and_final_impermanent_loss('startDate, EndDate, rewards, IL_Amount)