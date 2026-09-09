"""Compatibility entry point: Goon is restored with a payment-free ending.
The restoration gate verifies real merges, the win screen and no payment inputs.
"""
import runpy
from pathlib import Path
runpy.run_path(str(Path(__file__).with_name('check_fuel_goon.py')),run_name='__main__')
