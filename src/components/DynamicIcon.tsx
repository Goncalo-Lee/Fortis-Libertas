import {
    ShoppingCart, ShoppingBasket, Utensils, Coffee, Home, Car, Fuel, Bus,
    Plane, Bed, GraduationCap, Stethoscope, Dumbbell, Film, Gamepad2,
    Music, PawPrint, Baby, Shirt, PiggyBank, Landmark, Banknote,
    CreditCard, Receipt, Briefcase, TrendingUp, TrendingDown, FileText,
    HeartHandshake, Zap, Droplet, Wifi, Smartphone, Wrench, WashingMachine,
    Gift, PartyPopper, LayoutGrid, CircleDot
} from "lucide-react";

const iconMap: Record<string, any> = {
    "shopping_cart": ShoppingCart,
    "local_grocery_store": ShoppingBasket,
    "restaurant": Utensils,
    "local_cafe": Coffee,
    "home": Home,
    "directions_car": Car,
    "local_gas_station": Fuel,
    "directions_bus": Bus,
    "flight": Plane,
    "hotel": Bed,
    "school": GraduationCap,
    "medical_services": Stethoscope,
    "fitness_center": Dumbbell,
    "movie": Film,
    "sports_esports": Gamepad2,
    "music_note": Music,
    "pets": PawPrint,
    "child_care": Baby,
    "checkroom": Shirt,
    "savings": PiggyBank,
    "account_balance": Landmark,
    "payments": Banknote,
    "credit_card": CreditCard,
    "receipt_long": Receipt,
    "work": Briefcase,
    "trending_up": TrendingUp,
    "trending_down": TrendingDown,
    "request_quote": FileText,
    "volunteer_activism": HeartHandshake,
    "bolt": Zap,
    "water_drop": Droplet,
    "wifi": Wifi,
    "phone_iphone": Smartphone,
    "build": Wrench,
    "local_laundry_service": WashingMachine,
    "card_giftcard": Gift,
    "celebration": PartyPopper,
    "category": LayoutGrid
};

export function DynamicIcon({ name, className }: { name?: string; className?: string }) {
    // Se o backend enviar um icon válido, mapeia. Se não, mostra o LayoutGrid (por defeito)
    const IconComponent = name && iconMap[name] ? iconMap[name] : CircleDot;
    return <IconComponent className={className} />;
}