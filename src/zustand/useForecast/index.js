import { create } from 'zustand'

export const useForecast = create((set) => ({
    orderData: {},
    setOrderData: (data) => set({ orderData: data }),

    paramValues: {
        customer_data: [],
        sales_name_data: [],
        status_payment_data: [],
        source_data: [],
        company_si_data: [],
        customer_type_data: [],
        product_category_data: [],
        po_type_data: [],
        forecast_status_data: [],
        project_category_data: [],
        site_type_data: []
    },
    setParamValues: (params) => set((state) => ({
        paramValues: { ...state.paramValues, ...params }
    })),
}))