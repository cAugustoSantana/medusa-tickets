import { 
    Text, 
    Column, 
    Container, 
    Heading, 
    Html, 
    Img, 
    Row, 
    Section, 
    Tailwind, 
    Head, 
    Preview, 
    Body, 
    Link, 
  } from "@react-email/components"
  import { BigNumberValue, CustomerDTO, OrderDTO } from "@medusajs/framework/types"
  import { getTicketValidationUrl } from "../../../lib/util/url"
  
  type OrderPlacedEmailProps = {
    order: OrderDTO & {
      customer: CustomerDTO
    }
    items?: Array<{
      itemId: string;
      qrCode: string;
      productTitle: string;
      variantTitle: string;
      quantity: number;
      unitPrice: number;
      total: number;
      qrData: any;
    }>
    totalItems?: number
    customer?: {
      first_name?: string;
      last_name?: string;
    }
    billing_address?: any
    email_banner?: {
      body: string
      title: string
      url: string
    }
  }
  
  function OrderPlacedEmailComponent({ order, items, totalItems, customer, billing_address, email_banner }: OrderPlacedEmailProps) {
    const shouldDisplayBanner = email_banner && "title" in email_banner
  
    const formatter = new Intl.NumberFormat([], {
      style: "currency",
      currencyDisplay: "narrowSymbol",
      currency: order.currency_code,
    })
  
    const formatPrice = (price: BigNumberValue | number | string | null | undefined) => {
      // Handle null/undefined
      if (price === null || price === undefined) {
        return formatter.format(0)
      }
  
      // Handle plain numbers
      if (typeof price === "number") {
        return formatter.format(price)
      }
  
      // Handle strings
      if (typeof price === "string") {
        const parsed = parseFloat(price)
        return isNaN(parsed) ? formatter.format(0) : formatter.format(parsed)
      }
  
      // Handle BigNumberValue objects (fallback for any remaining cases)
      if (price && typeof price === "object") {
        // Check if it's a BigNumber object with valueOf method
        if (typeof (price as any).valueOf === 'function') {
          const numericValue = (price as any).valueOf()
          return formatter.format(numericValue)
        }
        
        // Check for raw value properties (for BigNumberRawValue)
        if ((price as any)?.value !== undefined) {
          const parsed = parseFloat((price as any).value)
          return isNaN(parsed) ? formatter.format(0) : formatter.format(parsed)
        }
        
        if ((price as any)?.amount !== undefined) {
          const parsed = parseFloat((price as any).amount)
          return isNaN(parsed) ? formatter.format(0) : formatter.format(parsed)
        }
        
        if ((price as any)?.calculated_amount !== undefined) {
          const parsed = parseFloat((price as any).calculated_amount)
          return isNaN(parsed) ? formatter.format(0) : formatter.format(parsed)
        }
      }
  
      // Fallback for any other case
      return formatter.format(0)
    }
  
    return (
      <Tailwind>
        <Html className="font-sans bg-gray-100">
          <Head />
          <Preview>Thank you for your order from Medusa</Preview>
          <Body className="bg-white my-10 mx-auto w-full max-w-2xl">
            {/* Header */}
            <Section className="bg-[#27272a] text-white px-6 py-4">
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.2447 3.92183L12.1688 1.57686C10.8352 0.807712 9.20112 0.807712 7.86753 1.57686L3.77285 3.92183C2.45804 4.69098 1.63159 6.11673 1.63159 7.63627V12.345C1.63159 13.8833 2.45804 15.2903 3.77285 16.0594L7.84875 18.4231C9.18234 19.1923 10.8165 19.1923 12.15 18.4231L16.2259 16.0594C17.5595 15.2903 18.3672 13.8833 18.3672 12.345V7.63627C18.4048 6.11673 17.5783 4.69098 16.2447 3.92183ZM10.0088 14.1834C7.69849 14.1834 5.82019 12.3075 5.82019 10C5.82019 7.69255 7.69849 5.81657 10.0088 5.81657C12.3191 5.81657 14.2162 7.69255 14.2162 10C14.2162 12.3075 12.3379 14.1834 10.0088 14.1834Z" fill="currentColor"></path></svg>
            </Section>
  
            {/* Thank You Message */}
            <Container className="p-6">
              <Heading className="text-2xl font-bold text-center text-gray-800">
                Thank you for your order, {order.customer?.first_name || order.shipping_address?.first_name}
              </Heading>
              <Text className="text-center text-gray-600 mt-2">
                We're processing your order and will notify you when it ships.
              </Text>
            </Container>
  
            {/* Promotional Banner */}
            {shouldDisplayBanner && (
              <Container
                className="mb-4 rounded-lg p-7"
                style={{
                  background: "linear-gradient(to right, #3b82f6, #4f46e5)",
                }}
              >
                <Section>
                  <Row>
                    <Column align="left">
                      <Heading className="text-white text-xl font-semibold">
                        {email_banner.title}
                      </Heading>
                      <Text className="text-white mt-2">{email_banner.body}</Text>
                    </Column>
                    <Column align="right">
                      <Link href={email_banner.url} className="font-semibold px-2 text-white underline">
                        Shop Now
                      </Link>
                    </Column>
                  </Row>
                </Section>
              </Container>
            )}
  
            {/* Download Tickets Button */}
            <Container className="px-6">
              <Section className="mt-8 text-center">
                <a
                  href={`${process.env.STORE_URL || 'http://localhost:8000'}/order/${order.id}/confirmed`}
                  className="inline-block bg-black text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                  style={{ textDecoration: 'none' }}
                >
                  Download Tickets
                </a>
              </Section>
            </Container>

            {/* Order Items */}
            <Container className="px-6">
              <Heading className="text-xl font-semibold text-gray-800 mb-4">
                Your Items
              </Heading>
              <Row>
                <Column>
                  <Text className="text-sm m-0 my-2 text-gray-500">Order ID: #{order.display_id}</Text>
                </Column>
              </Row>
              {order.items?.map((item) => (
                <Section key={item.id} className="border-b border-gray-200 py-4">
                  <Row>
                    <Column className="w-1/3">
                      <Img
                        src={item.thumbnail ?? ""}
                        alt={item.product_title ?? ""}
                        className="rounded-lg"
                        width="100%"
                      />
                    </Column>
                    <Column className="w-2/3 pl-4">
                      <Text className="text-lg font-semibold text-gray-800">
                        {item.product_title}
                      </Text>
                      <Text className="text-gray-600">{item.variant_title}</Text>
                      <Text className="text-gray-800 mt-2 font-bold">
                        {formatPrice(item.total)}
                      </Text>
                    </Column>
                  </Row>
                </Section>
              ))}

              {/* QR Codes Section */}
              {items && items.length > 0 && (
                <Section className="mt-8">
                  <Heading className="text-xl font-semibold text-gray-800 mb-4">
                    Your Tickets & QR Codes
                  </Heading>
                  <Text className="text-gray-600 mb-4">
                    Your tickets are ready! Each QR code below contains your ticket information and can be scanned for validation at the venue. 
                    The QR codes include a validation URL that can be used to verify your tickets online.
                  </Text>
                  {items.map((item, index) => (
                    <Section key={item.itemId} className="border border-gray-200 rounded-lg p-4 mb-4">
                      <Row>
                        <Column className="w-1/3">
                          <div style={{ textAlign: 'center', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', minHeight: '200px' }}>
                            <Img
                              src={item.qrCode}
                              alt={`QR Code for item ${index + 1}`}
                              width="150"
                              height="150"
                              style={{
                                display: 'block',
                                margin: '0 auto',
                                maxWidth: '100%',
                                height: 'auto',
                                border: '1px solid #eee'
                              }}
                            />
                            <Text className="text-xs text-gray-500 mt-2">
                              QR Code for ticket validation
                            </Text>
                            <Text className="text-xs text-gray-400 mt-1">
                              Scan to verify ticket online
                            </Text>
                          </div>
                        </Column>
                        <Column className="w-2/3 pl-4">
                          <Text className="text-lg font-semibold text-gray-800">
                            Item {index + 1}
                          </Text>
                          <Text className="text-gray-600">
                            <strong>Product:</strong> {item.productTitle}
                          </Text>
                          {item.variantTitle && (
                            <Text className="text-gray-600">
                              <strong>Variant:</strong> {item.variantTitle}
                            </Text>
                          )}
                          <Text className="text-gray-600">
                            <strong>Quantity:</strong> {String(item.quantity)}
                          </Text>
                          <Text className="text-gray-600">
                            <strong>Unit Price:</strong> {formatPrice(item.unitPrice || 0)}
                          </Text>
                          <Text className="text-gray-600">
                            <strong>Total:</strong> {formatPrice(item.total || 0)}
                          </Text>
                        </Column>
                      </Row>
                    </Section>
                  ))}
                  <Text className="text-sm text-gray-500 mt-4">
                    Please save these QR codes or print them out. Each QR code contains a validation URL that can be scanned to verify your ticket online at the venue.
                  </Text>
                  <Text className="text-sm text-gray-500">
                    Total items with QR codes: {String(totalItems || 0)}
                  </Text>
                </Section>
              )}
  
              {/* Order Summary */}
              <Section className="mt-8">
                <Heading className="text-xl font-semibold text-gray-800 mb-4">
                  Order Summary
                </Heading>
                <Row className="text-gray-600">
                  <Column className="w-1/2">
                    <Text className="m-0">Subtotal</Text>
                  </Column>
                  <Column className="w-1/2 text-right">
                    <Text className="m-0">
                      {formatPrice(order.item_total)}
                    </Text>
                  </Column>
                </Row>
                {order.shipping_methods?.map((method) => (
                  <Row className="text-gray-600" key={method.id}>
                    <Column className="w-1/2">
                      <Text className="m-0">{method.name}</Text>
                    </Column>
                    <Column className="w-1/2 text-right">
                      <Text className="m-0">{formatPrice(method.total)}</Text>
                    </Column>
                  </Row>
                ))}
                <Row className="text-gray-600">
                  <Column className="w-1/2">
                    <Text className="m-0">Tax</Text>
                  </Column>
                  <Column className="w-1/2 text-right">
                    <Text className="m-0">{formatPrice(order.tax_total || 0)}</Text>
                  </Column>
                </Row>
                <Row className="border-t border-gray-200 mt-4 text-gray-800 font-bold">
                  <Column className="w-1/2">
                    <Text>Total</Text>
                  </Column>
                  <Column className="w-1/2 text-right">
                    <Text>{formatPrice(order.total)}</Text>
                  </Column>
                </Row>
              </Section>
            </Container>
  
            {/* Footer */}
            <Section className="bg-gray-50 p-6 mt-10">
              <Text className="text-center text-gray-500 text-sm">
                If you have any questions, reply to this email or contact our support team at support@medusajs.com.
              </Text>
              <Text className="text-center text-gray-500 text-sm">
                Order Token: {order.id}
              </Text>
              <Text className="text-center text-gray-400 text-xs mt-4">
                © {new Date().getFullYear()} Medusajs, Inc. All rights reserved.
              </Text>
            </Section>
          </Body>
        </Html>
      </Tailwind >
    )
  }
  
  export const orderPlacedEmail = (props: OrderPlacedEmailProps) => (
    <OrderPlacedEmailComponent {...props} />
  )

  const mockOrder = {
    "order": {
      "id": "order_01JSNXDH9BPJWWKVW03B9E9KW8",
      "display_id": 1,
      "email": "afsaf@gmail.com",
      "currency_code": "eur",
      "total": 20,
      "subtotal": 20,
      "discount_total": 0,
      "shipping_total": 10,
      "tax_total": 0,
      "item_subtotal": 10,
      "item_total": 10,
      "item_tax_total": 0,
      "customer_id": "cus_01JSNXD6VQC1YH56E4TGC81NWX",
      "items": [
        {
          "id": "ordli_01JSNXDH9C47KZ43WQ3TBFXZA9",
          "title": "L",
          "subtitle": "Medusa Sweatshirt",
          "thumbnail": "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatshirt-vintage-front.png",
          "variant_id": "variant_01JSNXAQCZ5X81A3NRSVFJ3ZHQ",
          "product_id": "prod_01JSNXAQBQ6MFV5VHKN420NXQW",
          "product_title": "Medusa Sweatshirt",
          "product_description": "Reimagine the feeling of a classic sweatshirt. With our cotton sweatshirt, everyday essentials no longer have to be ordinary.",
          "product_subtitle": null,
          "product_type": null,
          "product_type_id": null,
          "product_collection": null,
          "product_handle": "sweatshirt",
          "variant_sku": "SWEATSHIRT-L",
          "variant_barcode": null,
          "variant_title": "L",
          "variant_option_values": null,
          "requires_shipping": true,
          "is_giftcard": false,
          "is_discountable": true,
          "is_tax_inclusive": false,
          "is_custom_price": false,
          "metadata": {},
          "raw_compare_at_unit_price": null,
          "raw_unit_price": {
            "value": "10",
            "precision": 20,
          },
          "created_at": new Date(),
          "updated_at": new Date(),
          "deleted_at": null,
          "tax_lines": [],
          "adjustments": [],
          "compare_at_unit_price": null,
          "unit_price": 10,
          "quantity": 1,
          "raw_quantity": {
            "value": "1",
            "precision": 20,
          },
          "detail": {
            "id": "orditem_01JSNXDH9DK1XMESEZPADYFWKY",
            "version": 1,
            "metadata": null,
            "order_id": "order_01JSNXDH9BPJWWKVW03B9E9KW8",
            "raw_unit_price": null,
            "raw_compare_at_unit_price": null,
            "raw_quantity": {
              "value": "1",
              "precision": 20,
            },
            "raw_fulfilled_quantity": {
              "value": "0",
              "precision": 20,
            },
            "raw_delivered_quantity": {
              "value": "0",
              "precision": 20,
            },
            "raw_shipped_quantity": {
              "value": "0",
              "precision": 20,
            },
            "raw_return_requested_quantity": {
              "value": "0",
              "precision": 20,
            },
            "raw_return_received_quantity": {
              "value": "0",
              "precision": 20,
            },
            "raw_return_dismissed_quantity": {
              "value": "0",
              "precision": 20,
            },
            "raw_written_off_quantity": {
              "value": "0",
              "precision": 20,
            },
            "created_at": new Date(),
            "updated_at": new Date(),
            "deleted_at": null,
            "item_id": "ordli_01JSNXDH9C47KZ43WQ3TBFXZA9",
            "unit_price": null,
            "compare_at_unit_price": null,
            "quantity": 1,
            "fulfilled_quantity": 0,
            "delivered_quantity": 0,
            "shipped_quantity": 0,
            "return_requested_quantity": 0,
            "return_received_quantity": 0,
            "return_dismissed_quantity": 0,
            "written_off_quantity": 0,
          },
          "subtotal": 10,
          "total": 10,
          "original_total": 10,
          "discount_total": 0,
          "discount_subtotal": 0,
          "discount_tax_total": 0,
          "tax_total": 0,
          "original_tax_total": 0,
          "refundable_total_per_unit": 10,
          "refundable_total": 10,
          "fulfilled_total": 0,
          "shipped_total": 0,
          "return_requested_total": 0,
          "return_received_total": 0,
          "return_dismissed_total": 0,
          "write_off_total": 0,
          "raw_subtotal": {
            "value": "10",
            "precision": 20,
          },
          "raw_total": {
            "value": "10",
            "precision": 20,
          },
          "raw_original_total": {
            "value": "10",
            "precision": 20,
          },
          "raw_discount_total": {
            "value": "0",
            "precision": 20,
          },
          "raw_discount_subtotal": {
            "value": "0",
            "precision": 20,
          },
          "raw_discount_tax_total": {
            "value": "0",
            "precision": 20,
          },
          "raw_tax_total": {
            "value": "0",
            "precision": 20,
          },
          "raw_original_tax_total": {
            "value": "0",
            "precision": 20,
          },
          "raw_refundable_total_per_unit": {
            "value": "10",
            "precision": 20,
          },
          "raw_refundable_total": {
            "value": "10",
            "precision": 20,
          },
          "raw_fulfilled_total": {
            "value": "0",
            "precision": 20,
          },
          "raw_shipped_total": {
            "value": "0",
            "precision": 20,
          },
          "raw_return_requested_total": {
            "value": "0",
            "precision": 20,
          },
          "raw_return_received_total": {
            "value": "0",
            "precision": 20,
          },
          "raw_return_dismissed_total": {
            "value": "0",
            "precision": 20,
          },
          "raw_write_off_total": {
            "value": "0",
            "precision": 20,
          },
        },
      ],
      "shipping_address": {
        "id": "caaddr_01JSNXD6W0TGPH2JQD18K97B25",
        "customer_id": null,
        "company": "",
        "first_name": "safasf",
        "last_name": "asfaf",
        "address_1": "asfasf",
        "address_2": "",
        "city": "asfasf",
        "country_code": "dk",
        "province": "",
        "postal_code": "asfasf",
        "phone": "",
        "metadata": null,
        "created_at": "2025-04-25T07:25:48.801Z",
        "updated_at": "2025-04-25T07:25:48.801Z",
        "deleted_at": null,
      },
      "billing_address": {
        "id": "caaddr_01JSNXD6W0V7RNZH63CPG26K5W",
        "customer_id": null,
        "company": "",
        "first_name": "safasf",
        "last_name": "asfaf",
        "address_1": "asfasf",
        "address_2": "",
        "city": "asfasf",
        "country_code": "dk",
        "province": "",
        "postal_code": "asfasf",
        "phone": "",
        "metadata": null,
        "created_at": "2025-04-25T07:25:48.801Z",
        "updated_at": "2025-04-25T07:25:48.801Z",
        "deleted_at": null,
      },
      "shipping_methods": [
        {
          "id": "ordsm_01JSNXDH9B9DDRQXJT5J5AE5V1",
          "name": "Standard Shipping",
          "description": null,
          "is_tax_inclusive": false,
          "is_custom_amount": false,
          "shipping_option_id": "so_01JSNXAQA64APG6BNHGCMCTN6V",
          "data": {},
          "metadata": null,
          "raw_amount": {
            "value": "10",
            "precision": 20,
          },
          "created_at": new Date(),
          "updated_at": new Date(),
          "deleted_at": null,
          "tax_lines": [],
          "adjustments": [],
          "amount": 10,
          "order_id": "order_01JSNXDH9BPJWWKVW03B9E9KW8",
          "detail": {
            "id": "ordspmv_01JSNXDH9B5RAF4FH3M1HH3TEA",
            "version": 1,
            "order_id": "order_01JSNXDH9BPJWWKVW03B9E9KW8",
            "return_id": null,
            "exchange_id": null,
            "claim_id": null,
            "created_at": new Date(),
            "updated_at": new Date(),
            "deleted_at": null,
            "shipping_method_id": "ordsm_01JSNXDH9B9DDRQXJT5J5AE5V1",
          },
          "subtotal": 10,
          "total": 10,
          "original_total": 10,
          "discount_total": 0,
          "discount_subtotal": 0,
          "discount_tax_total": 0,
          "tax_total": 0,
          "original_tax_total": 0,
          "raw_subtotal": {
            "value": "10",
            "precision": 20,
          },
          "raw_total": {
            "value": "10",
            "precision": 20,
          },
          "raw_original_total": {
            "value": "10",
            "precision": 20,
          },
          "raw_discount_total": {
            "value": "0",
            "precision": 20,
          },
          "raw_discount_subtotal": {
            "value": "0",
            "precision": 20,
          },
          "raw_discount_tax_total": {
            "value": "0",
            "precision": 20,
          },
          "raw_tax_total": {
            "value": "0",
            "precision": 20,
          },
          "raw_original_tax_total": {
            "value": "0",
            "precision": 20,
          },
        },
      ],
      "customer": {
        "id": "cus_01JSNXD6VQC1YH56E4TGC81NWX",
        "company_name": null,
        "first_name": null,
        "last_name": null,
        "email": "afsaf@gmail.com",
        "phone": null,
        "has_account": false,
        "metadata": null,
        "created_by": null,
        "created_at": "2025-04-25T07:25:48.791Z",
        "updated_at": "2025-04-25T07:25:48.791Z",
        "deleted_at": null,
      },
    },
  }
  // @ts-ignore
  export default () => <OrderPlacedEmailComponent {...mockOrder} />