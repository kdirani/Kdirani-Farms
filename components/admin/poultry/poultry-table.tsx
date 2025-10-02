'use client';

import { useState } from 'react';
import { PoultryStatus } from '@/actions/poultry.actions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserCog, MoreHorizontal, Search, Plus } from 'lucide-react';
import { CreatePoultryDialog } from './create-poultry-dialog';
import { EditPoultryDialog } from './edit-poultry-dialog';
import { DeletePoultryDialog } from './delete-poultry-dialog';
import { format } from 'date-fns';

interface PoultryTableProps {
  poultryStatuses: PoultryStatus[];
}

export function PoultryTable({ poultryStatuses }: PoultryTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPoultry, setSelectedPoultry] = useState<PoultryStatus | null>(null);

  const filteredPoultry = poultryStatuses.filter(
    (poultry) =>
      poultry.batch_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      poultry.farm?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      poultry.farm?.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (poultry: PoultryStatus) => {
    const mortalityRate = (poultry.dead_chicks / poultry.opening_chicks) * 100;
    
    if (mortalityRate === 0) {
      return <Badge variant="success">Excellent</Badge>;
    } else if (mortalityRate < 5) {
      return <Badge variant="success">Good</Badge>;
    } else if (mortalityRate < 10) {
      return <Badge variant="warning">Fair</Badge>;
    } else {
      return <Badge variant="destructive">Poor</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search batches..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Poultry Batch
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Batch Name</TableHead>
              <TableHead>Farm</TableHead>
              <TableHead>Farmer</TableHead>
              <TableHead className="text-right">Opening</TableHead>
              <TableHead className="text-right">Dead</TableHead>
              <TableHead className="text-right">Remaining</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPoultry.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  No poultry batches found
                </TableCell>
              </TableRow>
            ) : (
              filteredPoultry.map((poultry) => (
                <TableRow key={poultry.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <UserCog className="h-4 w-4 text-muted-foreground" />
                      {poultry.batch_name || 'Unnamed Batch'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {poultry.farm ? (
                      <div>
                        <div className="font-medium">{poultry.farm.name}</div>
                        {poultry.farm.location && (
                          <div className="text-xs text-muted-foreground">{poultry.farm.location}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No farm</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {poultry.farm?.user_name || (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {poultry.opening_chicks.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-destructive">
                    {poultry.dead_chicks.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {poultry.remaining_chicks.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(poultry)}
                  </TableCell>
                  <TableCell>
                    {format(new Date(poultry.created_at), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedPoultry(poultry);
                            setEditDialogOpen(true);
                          }}
                        >
                          Edit Batch
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedPoultry(poultry);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-destructive"
                        >
                          Delete Batch
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CreatePoultryDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

      {selectedPoultry && (
        <>
          <EditPoultryDialog
            poultry={selectedPoultry}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
          />
          <DeletePoultryDialog
            poultry={selectedPoultry}
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
          />
        </>
      )}
    </div>
  );
}
