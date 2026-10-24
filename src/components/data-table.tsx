"use client"

import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  columnFilteringFeature,
  columnVisibilityFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  FlexRender,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type ColumnFiltersState,
  type ColumnVisibilityState,
  type Row,
  type SortingState,
} from "@tanstack/react-table"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { toast } from "sonner"
import { z } from "zod"

import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { GripVerticalIcon, CircleCheckIcon, LoaderIcon, EllipsisVerticalIcon, Columns3Icon, ChevronDownIcon, PlusIcon, ChevronsLeftIcon, ChevronLeftIcon, ChevronRightIcon, ChevronsRightIcon, TrendingUpIcon } from "lucide-react"

const features = tableFeatures({
  columnFilteringFeature,
  columnVisibilityFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
})

const columnHelper = createColumnHelper<
    typeof features,
    z.infer<typeof schema>
>()

// SCHEMA TOTALMENTE RENOMEADO
export const schema = z.object({
  id: z.number(),
  username: z.string(),
  fullName: z.string(),
  email: z.string(),
  role: z.string(),
  blocked: z.string(),
  accountStatus: z.string(),
})

const columnTranslations: Record<string, string> = {
  username: "Nome do utilizador",
  fullName: "Nome completo",
  email: "Email",
  role: "Cargo",
  blocked: "Bloqueado",
  accountStatus: "Estado",
}

function DragHandle({ id }: { id: number }) {
  const { attributes, listeners } = useSortable({
    id,
  })
  return (
      <Button
          {...attributes}
          {...listeners}
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground hover:bg-transparent"
      >
        <GripVerticalIcon className="size-3 text-muted-foreground" />
        <span className="sr-only">Arraste para reordenar</span>
      </Button>
  )
}

const columns = columnHelper.columns([
  columnHelper.display({
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
  }),
  columnHelper.display({
    id: "select",
    header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
              checked={table.getIsAllPageRowsSelected()}
              indeterminate={
                  table.getIsSomePageRowsSelected() &&
                  !table.getIsAllPageRowsSelected()
              }
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
              aria-label="Selecionar tudo"
          />
        </div>
    ),
    cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Selecionar linha"
          />
        </div>
    ),
    enableSorting: false,
    enableHiding: false,
  }),
  columnHelper.accessor("username", {
    header: "Nome do utilizador",
    cell: ({ row }) => {
      return <TableCellViewer item={row.original} />
    },
    filterFn: (row, columnId, filterValue) => {
      const search = filterValue.toLowerCase()
      const username = row.original.username.toLowerCase()
      const fullName = row.original.fullName.toLowerCase()
      return username.includes(search) || fullName.includes(search)
    }
  }),
  columnHelper.accessor("fullName", {
    header: "Nome completo",
    cell: ({ row }) => (
        <span className="text-foreground">{row.original.fullName}</span>
    ),
  }),
  columnHelper.accessor("email", {
    header: "Email",
    cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.email}</span>
    ),
  }),
  columnHelper.accessor("role", {
    header: "Cargo",
    cell: ({ row }) => (
        <Badge
            variant={row.original.role === "Admin" ? "default" : "secondary"}
            className="font-normal"
        >
          {row.original.role}
        </Badge>
    ),
  }),
  columnHelper.accessor("blocked", {
    header: "Bloqueado",
    cell: ({ row }) => (
        <span className={row.original.blocked === "Sim" ? "text-destructive font-medium" : "text-muted-foreground"}>
          {row.original.blocked}
        </span>
    ),
  }),
  columnHelper.accessor("accountStatus", {
    header: "Estado",
    cell: ({ row }) => {
      const estado = row.original.accountStatus
      return (
          <Badge variant="outline" className="px-2 py-0.5 font-normal text-muted-foreground">
            {estado === "Ativo" && (
                <CircleCheckIcon className="mr-1.5 size-3.5 fill-green-500 text-background dark:fill-green-400" />
            )}
            {estado === "Pendente" && (
                <LoaderIcon className="mr-1.5 size-3.5 animate-spin" />
            )}
            {estado === "Inativo" && (
                <div className="mr-2 size-2 rounded-full bg-destructive" />
            )}
            {estado}
          </Badge>
      )
    },
  }),
  columnHelper.display({
    id: "actions",
    cell: () => (
        <DropdownMenu>
          <DropdownMenuTrigger
              render={
                <Button
                    variant="ghost"
                    className="flex size-8 text-muted-foreground data-open:bg-muted"
                    size="icon"
                />
              }
          >
            <EllipsisVerticalIcon />
            <span className="sr-only">Abrir menu</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem>Editar</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Eliminar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
    ),
    enableHiding: false,
  }),
])

function DraggableRow({
                        row,
                      }: {
  row: Row<typeof features, z.infer<typeof schema>>
}) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  })
  return (
      <TableRow
          data-state={row.getIsSelected() && "selected"}
          data-dragging={isDragging}
          ref={setNodeRef}
          className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
          style={{
            transform: CSS.Transform.toString(transform),
            transition: transition,
          }}
      >
        {row.getVisibleCells().map((cell) => (
            <TableCell key={cell.id}>
              <FlexRender cell={cell} />
            </TableCell>
        ))}
      </TableRow>
  )
}

export function DataTable({
                            data: initialData,
                          }: {
  data: z.infer<typeof schema>[]
}) {
  const [data, setData] = React.useState(() => initialData)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<ColumnVisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const [searchTerm, setSearchTerm] = React.useState("")

  const sortableId = React.useId()
  const sensors = useSensors(
      useSensor(MouseSensor, {}),
      useSensor(TouchSensor, {}),
      useSensor(KeyboardSensor, {})
  )
  const dataIds = React.useMemo<UniqueIdentifier[]>(
      () => data?.map(({ id }) => id) || [],
      [data]
  )
  const table = useTable({
    features,
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        return arrayMove(data, oldIndex, newIndex)
      })
    }
  }

  return (
      <Tabs
          defaultValue="outline"
          className="w-full flex-col justify-start gap-6 font-poppins"
      >
        <div className="flex items-center justify-between px-4 lg:px-6">
          <Label htmlFor="view-selector" className="sr-only">
            Visualização
          </Label>

          <TabsList className="hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:px-1 @4xl/main:flex">
            <TabsTrigger value="outline">Resumo</TabsTrigger>
            <TabsTrigger value="past-performance">
              Desempenho Passado <Badge variant="secondary">3</Badge>
            </TabsTrigger>
            <TabsTrigger value="key-personnel">
              Pessoal Chave <Badge variant="secondary">2</Badge>
            </TabsTrigger>
            <TabsTrigger value="focus-documents">Documentos</TabsTrigger>
          </TabsList>

          <div className="ml-auto flex items-center gap-2">

            {/* Input filtrando pela coluna correta 'username' */}
            <Input
                placeholder="Procurar utilizador..."
                value={searchTerm}
                onChange={(event) => {
                  const value = event.target.value;
                  setSearchTerm(value);
                  table.getColumn("username")?.setFilterValue(value);
                }}
                className="h-8 w-[150px] lg:w-[250px]"
            />

            <DropdownMenu>
              <DropdownMenuTrigger
                  render={<Button variant="outline" size="sm" />}
              >
                <Columns3Icon data-icon="inline-start" />
                Colunas
                <ChevronDownIcon data-icon="inline-end" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {table
                    .getAllColumns()
                    .filter(
                        (column) =>
                            typeof column.accessorFn !== "undefined" &&
                            column.getCanHide()
                    )
                    .map((column) => {
                      return (
                          <DropdownMenuCheckboxItem
                              key={column.id}
                              className="capitalize"
                              checked={column.getIsVisible()}
                              onCheckedChange={(value) =>
                                  column.toggleVisibility(!!value)
                              }
                          >
                            {columnTranslations[column.id] || column.id}
                          </DropdownMenuCheckboxItem>
                      )
                    })}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" className="">
              <PlusIcon />
              <span className="hidden lg:inline">Adicionar utilizador</span>
            </Button>
          </div>
        </div>
        <TabsContent
            value="outline"
            className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
        >
          <div className="overflow-hidden rounded-lg border">
            <DndContext
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis]}
                onDragEnd={handleDragEnd}
                sensors={sensors}
                id={sortableId}
            >
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-muted">
                  {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                          return (
                              <TableHead key={header.id} colSpan={header.colSpan}>
                                {header.isPlaceholder ? null : (
                                    <FlexRender header={header} />
                                )}
                              </TableHead>
                          )
                        })}
                      </TableRow>
                  ))}
                </TableHeader>
                <TableBody className="**:data-[slot=table-cell]:first:w-8">
                  {table.getRowModel().rows?.length ? (
                      <SortableContext
                          items={dataIds}
                          strategy={verticalListSortingStrategy}
                      >
                        {table.getRowModel().rows.map((row) => (
                            <DraggableRow key={row.id} row={row} />
                        ))}
                      </SortableContext>
                  ) : (
                      <TableRow>
                        <TableCell
                            colSpan={columns.length}
                            className="h-24 text-center"
                        >
                          Nenhum utilizador encontrado.
                        </TableCell>
                      </TableRow>
                  )}
                </TableBody>
              </Table>
            </DndContext>
          </div>
          <div className="flex items-center justify-between px-4">
            <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
              {table.getFilteredSelectedRowModel().rows.length} de{" "}
              {table.getFilteredRowModel().rows.length} linha(s) selecionada(s).
            </div>
            <div className="flex w-full items-center gap-8 lg:w-fit">
              <div className="hidden items-center gap-2 lg:flex">
                <Label htmlFor="rows-per-page" className="text-sm font-medium">
                  Linhas por página
                </Label>
                <Select
                    value={`${table.state.pagination.pageSize}`}
                    onValueChange={(value) => {
                      table.setPageSize(Number(value))
                    }}
                    items={[10, 20, 30, 40, 50].map((pageSize) => ({
                      label: `${pageSize}`,
                      value: `${pageSize}`,
                    }))}
                >
                  <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                    <SelectValue placeholder={table.state.pagination.pageSize} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    <SelectGroup>
                      {[10, 20, 30, 40, 50].map((pageSize) => (
                          <SelectItem key={pageSize} value={`${pageSize}`}>
                            {pageSize}
                          </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex w-fit items-center justify-center text-sm font-medium">
                Página {table.state.pagination.pageIndex + 1} de{" "}
                {table.getPageCount()}
              </div>
              <div className="ml-auto flex items-center gap-2 lg:ml-0">
                <Button
                    variant="outline"
                    className="hidden h-8 w-8 p-0 lg:flex"
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Ir para a primeira página</span>
                  <ChevronsLeftIcon />
                </Button>
                <Button
                    variant="outline"
                    className="size-8"
                    size="icon"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Ir para a página anterior</span>
                  <ChevronLeftIcon />
                </Button>
                <Button
                    variant="outline"
                    className="size-8"
                    size="icon"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Ir para a próxima página</span>
                  <ChevronRightIcon />
                </Button>
                <Button
                    variant="outline"
                    className="hidden size-8 lg:flex"
                    size="icon"
                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                    disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Ir para a última página</span>
                  <ChevronsRightIcon />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent
            value="past-performance"
            className="flex flex-col px-4 lg:px-6"
        >
          <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
        </TabsContent>
        <TabsContent value="key-personnel" className="flex flex-col px-4 lg:px-6">
          <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
        </TabsContent>
        <TabsContent
            value="focus-documents"
            className="flex flex-col px-4 lg:px-6"
        >
          <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
        </TabsContent>
      </Tabs>
  )
}

const chartData = [
  { month: "Janeiro", desktop: 186, mobile: 80 },
  { month: "Fevereiro", desktop: 305, mobile: 200 },
  { month: "Março", desktop: 237, mobile: 120 },
  { month: "Abril", desktop: 73, mobile: 190 },
  { month: "Maio", desktop: 209, mobile: 130 },
  { month: "Junho", desktop: 214, mobile: 140 },
]

const chartConfig = {
  desktop: {
    label: "Sessões Web",
    color: "var(--primary)",
  },
  mobile: {
    label: "Sessões Mobile",
    color: "var(--primary)",
  },
} satisfies ChartConfig

function TableCellViewer({ item }: { item: z.infer<typeof schema> }) {
  const isMobile = useIsMobile()
  return (
      <Drawer swipeDirection={isMobile ? "down" : "right"}>
        <DrawerTrigger
            render={
              <Button
                  variant="link"
                  className="w-fit px-0 text-left text-foreground font-normal hover:underline"
              />
            }
        >
          {item.username}
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className="gap-1">
            <DrawerTitle>Editar: {item.username}</DrawerTitle>
            <DrawerDescription>
              Atualize as informações, cargo e estado da conta deste utilizador.
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
            {!isMobile && (
                <>
                  <ChartContainer config={chartConfig}>
                    <AreaChart
                        accessibilityLayer
                        data={chartData}
                        margin={{
                          left: 0,
                          right: 10,
                        }}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis
                          dataKey="month"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          tickFormatter={(value) => value.slice(0, 3)}
                          hide
                      />
                      <ChartTooltip
                          cursor={false}
                          content={<ChartTooltipContent indicator="dot" />}
                      />
                      <Area
                          dataKey="mobile"
                          type="natural"
                          fill="var(--color-mobile)"
                          fillOpacity={0.6}
                          stroke="var(--color-mobile)"
                          stackId="a"
                      />
                      <Area
                          dataKey="desktop"
                          type="natural"
                          fill="var(--color-desktop)"
                          fillOpacity={0.4}
                          stroke="var(--color-desktop)"
                          stackId="a"
                      />
                    </AreaChart>
                  </ChartContainer>
                  <Separator />
                  <div className="grid gap-2">
                    <div className="flex gap-2 leading-none font-medium">
                      Atividade subiu 5.2% este mês <TrendingUpIcon className="size-4" />
                    </div>
                    <div className="text-muted-foreground">
                      Gráfico representativo da atividade do utilizador nos últimos 6 meses.
                    </div>
                  </div>
                  <Separator />
                </>
            )}

            <form className="flex flex-col gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="username">Nome do utilizador</Label>
                <Input id="username" defaultValue={item.username} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-3">
                  <Label htmlFor="fullName">Nome completo</Label>
                  <Input id="fullName" defaultValue={item.fullName} />
                </div>
                <div className="flex flex-col gap-3">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue={item.email} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-3">
                  <Label htmlFor="role">Cargo</Label>
                  <Input id="role" defaultValue={item.role} />
                </div>
                <div className="flex flex-col gap-3">
                  <Label htmlFor="blocked">Bloqueado</Label>
                  <Select
                      defaultValue={item.blocked || "Não"}
                      items={[
                        { label: "Sim", value: "Sim" },
                        { label: "Não", value: "Não" },
                      ]}
                  >
                    <SelectTrigger id="blocked" className="w-full">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="Sim">Sim</SelectItem>
                        <SelectItem value="Não">Não</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Label htmlFor="accountStatus">Estado da Conta</Label>
                <Select
                    defaultValue={item.accountStatus || "Ativo"}
                    items={[
                      { label: "Ativo", value: "Ativo" },
                      { label: "Inativo", value: "Inativo" },
                      { label: "Pendente", value: "Pendente" },
                    ]}
                >
                  <SelectTrigger id="accountStatus" className="w-full">
                    <SelectValue placeholder="Selecione um estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                      <SelectItem value="Pendente">Pendente</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </form>
          </div>
          <DrawerFooter>
            <Button>Guardar Alterações</Button>
            <DrawerClose render={<Button variant="outline" />}>Cancelar</DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
  )
}