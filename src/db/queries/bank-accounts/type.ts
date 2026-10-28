export type ListFiltersBankAccount = {
    // Paginação
    limit: number;
    offset: number;

    // Pesquisa
    q?: string;

    // Filtros específicos documentados na API
    frozen?: boolean;
    role?: "owner" | "editor" | "viewer";

    // Ordenação permitida (name ou created_at, com o prefixo '-' para descendente)
    sort?: "name" | "-name" | "created_at" | "-created_at";
};