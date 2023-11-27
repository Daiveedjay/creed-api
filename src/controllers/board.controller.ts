import { Body, Delete, Get, Patch, Post, Request, Route, Security, Tags } from "tsoa";
import { injectable } from "tsyringe";
import { BoardCreateDTO, BoardUpdateDTO } from "@/schemas/board.schema";
import BoardService from "@/services/board.service";
import BaseController from "@/utils/customBaseController";
import { AuthRequest } from "@/types/auth.types";

@injectable()
@Route("/api/domains/{domainId}/boards")
@Tags("Boards")
export class BoardController extends BaseController {
  constructor(private boardService: BoardService) {
    super();
  }

  /**
   * Retrieves a list of boards for a domain
   */
  @Get("/")
  @Security("bearerAuth")
  public async getBoards(domainId: string, @Request() req: AuthRequest): Promise<any> {
    return this.boardService.getBoards(req.auth?.uid as string, domainId);
  }

  /**
   * Retrieves a specific board
   */
  @Get("{boardId}")
  @Security("bearerAuth")
  public async getBoard(boardId: string, @Request() req: AuthRequest): Promise<any> {
    return this.boardService.getBoard(req.auth?.uid as string, boardId);
  }

  /**
   * Creates a new board in a domain
   */
  @Post("/")
  @Security("bearerAuth")
  public async createBoard(@Request() req: AuthRequest, @Body() dto: BoardCreateDTO): Promise<any> {
    return this.boardService.createBoard(req.auth?.uid as string, dto);
  }

  /**
   * Edits a board
   */
  @Patch("{boardId}")
  @Security("bearerAuth")
  public async editBoard(boardId: string, @Request() req: AuthRequest, @Body() dto: BoardUpdateDTO): Promise<any> {
    return this.boardService.editBoard(req.auth?.uid as string, boardId, dto);
  }

  /**
   * Deletes a board
   */
  @Delete("{boardId}")
  @Security("bearerAuth")
  public async deleteBoard(boardId: string, @Request() req: AuthRequest): Promise<any> {
    return this.boardService.deleteBoard(req.auth?.uid as string, boardId);
  }
}
