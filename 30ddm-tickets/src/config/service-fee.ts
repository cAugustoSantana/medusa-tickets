/**
 * Service fee configuration
 * 
 * This file contains the service fee percentage that is applied to all ticket products.
 * The fee is calculated as a percentage of the ticket price.
 * 
 * To change the service fee, modify the SERVICE_FEE_PERCENTAGE constant below.
 * For example:
 * - 0.1 = 10%
 * - 0.15 = 15%
 * - 0.05 = 5%
 * 
 * You can also make this configurable via environment variable:
 * const SERVICE_FEE_PERCENTAGE = parseFloat(process.env.SERVICE_FEE_PERCENTAGE || "0.1")
 */

export const SERVICE_FEE_PERCENTAGE = 0.1 // 10%

